'use strict';

const _ = require('lodash');
const socketIoClient = require('socket.io-client');

const BaseServer = require('../common/BaseServer');
const IoGrant = require('./IoGrant');
const { ioToError } = require('../common/utils');

class IoApi extends BaseServer {
    constructor(opts) {
        super();

        let uri;
        if (_.isString(opts)) {
            uri = opts;
        } else if (_.isPlainObject(opts) && _.isString(opts.host)) {
            uri = `${opts.host}:${opts.port || 80}`;
        } else {
            throw new Error(
                'opts should be a string or { host: string, port?: number }'
            );
        }

        this.socket = socketIoClient.connect(uri);
    }

    addManager() {
        throw new Error('IoApi is readonly and managers cannot be added');
    }

    getManagers() {
        return this._request('quota.getManagers', managers => managers);
    }

    requestQuota(managerName, scope, resources, options) {
        return this._request(
            'quota.request',
            grantId => new IoGrant(this, grantId),
            {
                managerName,
                scope,
                resources,
                options
            }
        );
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
