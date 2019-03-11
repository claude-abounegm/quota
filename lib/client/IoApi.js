'use strict';

const socketIoClient = require('socket.io-client');

const BaseServer = require('../server/BaseServer');
const IoGrant = require('./IoGrant');
const {
    ioToError,
    errorToIo
} = require('../common/utils');

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

    reportError(managerName, e) {
        return this._request('quota.reportError', _.noop, {
            managerName,
            error: errorToIo(e)
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
     * 
     * @private
     */
    _request(requestName, cb, ...args) {
        return new Promise((resolve, reject) => {
            this.socket.emit(requestName, ...args, (e, ...args) => {
                if (e) {
                    return reject(ioToError(e));
                }

                resolve(cb(...args));
            });
        });
    }
}

module.exports = IoApi;