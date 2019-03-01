'use strict';

const socketIoClient = require('socket.io-client');

const errors = require('../common/errors');
const BaseServer = require('../server/BaseServer');
const IoGrant = require('./IoGrant');

class IoApi extends BaseServer {
    constructor({
        uri = 'http://localhost'
    }) {
        super();

        const socket = socketIoClient.connect(uri);
        socket.on('disconnect', reason => {
            if (reason === 'io server disconnect') {
                socket.connect(uri);
            }
        });

        this.socket = socket;
    }

    addManager() {
        throw new Error('IoApi is readonly and managers cannot be added');
    }

    getManagers() {
        return this._request('quota.getManagers', managers => managers);
    }

    requestQuota(managerName, scope, resources, options) {
        return this._request('quota.request', grantId => new IoGrant(this.socket, grantId), {
            managerName,
            scope,
            resources,
            options
        });
    }

    dispose() {
        this.socket.close();
    }

    /**
     * @template T
     * @param {string} requestName 
     * @param {(...args) => T} cb 
     * @param  {...any} args 
     * @return {Promise<T>}
     */
    _request(requestName, cb, ...args) {
        return new Promise((resolve, reject) => {
            this.socket.emit(requestName, ...args, (e, ...args) => {
                if (e) {
                    // rebuild error
                    const {
                        type,
                        message,
                        opts,
                        fields
                    } = e;

                    let error;
                    if (type !== 'Error' && errors[type]) {
                        error = new errors[type](...opts);
                    } else {
                        error = new Error(message);
                    }

                    if (fields) {
                        Object.assign(error, fields);
                    }

                    return reject(error);
                }

                resolve(cb(...args));
            });
        });
    }
}

module.exports = IoApi;