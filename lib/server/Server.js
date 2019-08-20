'use strict';

const _ = require('lodash');
const uuidv1 = require('uuid/v1');

const { ioToError, errorToIo } = require('../common/utils');

const Manager = require('../core/Manager');
const loader = require('../core/loader');

const BaseServer = require('../common/BaseServer');
const BaseGrant = require('../common/BaseGrant');
const errors = require('../common/errors');

class Server extends BaseServer {
    constructor(managers, io) {
        super();

        /** @type { { [key: string]: Manager } } */
        this.managers = {};
        if (_.isPlainObject(managers)) {
            for (const [managerName, managerOrOptions] of _.toPairs(managers)) {
                this.addManager(managerName, managerOrOptions);
            }
        }

        if (io) {
            this.attachIo(io);
        }
    }

    addManager(managerName, options) {
        options = options || {};
        const { managers } = this;

        if (_.isPlainObject(managerName)) {
            options = managerName;
            managerName = options.name;
        }

        if (!_.isString(managerName)) {
            throw new Error(
                'Please pass a string for the managerName parameter'
            );
        } else if (managers[managerName]) {
            throw new Error(
                `A manager with the name ${managerName} was already added`
            );
        }

        if (options instanceof Manager) {
            if (options.name && options.name !== managerName) {
                options = new Manager(
                    { ...options.options, name: managerName },
                    options
                );
            } else {
                options.name = managerName;
            }

            managers[managerName] = options;
        } else if (_.isPlainObject(options)) {
            let manager;
            if (_.isString(options.preset)) {
                manager = loader.loadPreset(options.preset, options);
            } else {
                manager = new Manager({
                    name: managerName,
                    ...options
                });
            }

            // support multiple managers for one preset
            if (_.isPlainObject(manager)) {
                for (const [name, _manager] of _.toPairs(manager)) {
                    if (name === 'general') {
                        this.addManager(managerName, _manager);
                    }

                    this.addManager(`${managerName}-${name}`, _manager);
                }
            } else {
                this.addManager(managerName, manager);
            }
        } else {
            throw new Error(
                'Please correct the the second parameter you passed to addManager(...)'
            );
        }
    }

    async getManagers() {
        return _.keys(this.managers);
    }

    async requestQuota(managerName, scope, resources, options) {
        const manager = this.managers[managerName];
        if (!manager) {
            throw new errors.NoManagerError(managerName);
        }

        return manager.requestQuota(scope, resources, options);
    }

    attachIo(io) {
        if (!_.isPlainObject(this.ioGrants)) {
            this.ioGrants = {};
        }

        const { ioGrants } = this;

        io.on('connection', socket => {
            socket.on('quota.getManagers', async cb => {
                try {
                    cb(null, await this.getManagers());
                } catch (e) {
                    cb(errorToIo(e));
                }
            });

            socket.on(
                'quota.request',
                async ({ managerName, scope, resources, options }, cb) => {
                    try {
                        const grantId = uuidv1();
                        ioGrants[grantId] = await this.requestQuota(
                            managerName,
                            scope,
                            resources,
                            options
                        );
                        cb(null, grantId);
                    } catch (e) {
                        cb(errorToIo(e));
                    }
                }
            );

            socket.on('quota.dismissGrant', ({ grantId, feedback }, cb) => {
                /** @type {BaseGrant} */
                const grant = ioGrants[grantId];
                if (grant) {
                    if (feedback && feedback.error) {
                        feedback.error = ioToError(feedback.error);
                    }

                    grant.dismiss(feedback);
                    ioGrants[grantId] = undefined;
                }

                cb(null);
            });
        });
    }
}

module.exports = Server;
