'use strict';

const _ = require('lodash');

const IoApi = require('./IoApi');
const BaseServer = require('../common/BaseServer');
const Server = require('../server/Server');
const errors = require('../common/errors');

class Client {
    constructor(servers) {
        if (_.isUndefined(servers)) {
            throw new Error('Please pass at least one server to connect to.');
        }

        if (!_.isArray(servers)) {
            servers = [servers];
        } else if (servers.length === 0) {
            throw new Error('Please pass at least one server to connect to.');
        }

        /** @type {BaseServer[]} */
        this.servers = [];
        for (const server of servers) {
            this.addServer(server);
        }
    }

    addServer(server) {
        if (_.isUndefined(server)) {
            throw new Error('server cannot be undefined');
        }

        if (_.isString(server) || _.isPlainObject(server)) {
            server = new IoApi(server);
        }

        let type, api;

        if (server instanceof Server) {
            type = 'local';
            api = server;
        } else if (server instanceof IoApi) {
            type = 'io';
            api = server;
        } else {
            throw new TypeError(
                'Type of server ' + server + ' not yet supported.'
            );
        }

        this.servers.push({
            type,
            api,
            managers: null
        });

        return api;
    }

    async requestQuota(managerName, scope, resources, options) {
        return (await this._findServerForManager(managerName)).requestQuota(
            managerName,
            scope,
            resources,
            options
        );
    }

    async dispose() {
        for (const { api } of this.servers) {
            if (_.isFunction(api.dispose)) {
                await api.dispose();
            }
        }
    }

    /**
     * Finds the Quota Server running the given manager.
     *
     * @param managerName Name of the quota manager.
     * @returns {Promise<BaseServer>}
     * @private
     */
    async _findServerForManager(managerName, refreshCache) {
        if (refreshCache || this.servers.some(server => !server.managers)) {
            refreshCache = true; // So it won't be done a second time

            for (const server of this.servers) {
                server.managers = await server.api.getManagers();
            }
        }

        var serverApi = null;

        for (const server of this.servers) {
            if (_.includes(server.managers, managerName)) {
                serverApi = server.api;
                break;
            }
        }

        if (serverApi === null) {
            if (refreshCache) {
                throw new errors.NoManagerError(managerName);
            } else {
                return this._findServerForManager(managerName, true);
            }
        }

        return serverApi;
    }
}

module.exports = Client;
