'use strict';

const _ = require('lodash');

const Throttling = require('./throttling/Throttling');
const ScopeBundle = require('./ScopeBundle');
const loader = require('./loader');
const errors = require('../common/errors');

class Rule {
    constructor(options) {
        if (!_.isPlainObject(options)) {
            throw new Error('Please pass the rule options.');
        }

        if (!_.isUndefined(options.name) && !_.isString(options.name)) {
            throw new Error('Please pass either undefined or a string to options.name');
        }

        if (!_.isUndefined(options.limit) && (!_.isFinite(options.limit) || options.limit <= 0)) {
            throw new Error('Please pass a positive integer to options.limit');
        }

        if (!_.isUndefined(options.window) && (!_.isFinite(options.window) || options.window <= 0)) {
            throw new Error('Please pass a positive number to options.window');
        }

        if (!_.isString(options.throttling) && !_.isPlainObject(options.throttling)) {
            throw new Error('Please pass either a string or an object to options.throttling');
        } else if (_.isPlainObject(options.throttling) && !_.isString(options.throttling.type)) {
            throw new Error('Please pass the name of the throttling module to options.throttling.type');
        }

        if (!_.isUndefined(options.queueing) && !_.isString(options.queueing) && !_.isPlainObject(options.queueing)) {
            throw new Error('Please pass either undefined, a string, or an object to options.queueing');
        } else if (_.isPlainObject(options.queueing) && !_.isString(options.queueing.type)) {
            throw new Error('Please pass the name of the queueing module to options.queueing.type');
        }

        if (_.isUndefined(options.scope)) {
            options.scope = [];
        } else if (_.isString(options.scope)) {
            options.scope = [options.scope];
        } else if (_.isArray(options.scope)) {
            _.forEach(options.scope, function (entry) {
                if (!_.isString(entry) || entry === '') {
                    throw new Error('Please pass only strings into the options.scope array.');
                }
            });
        } else {
            throw new Error('Please pass either undefined, a string, or an array to options.scope');
        }

        if (!_.isUndefined(options.resource) && !_.isString(options.resource)) {
            throw new Error('Please pass either undefined or a string to options.resource');
        }

        this.options = options;

        /**
         * {
         *   limit: number,
         *   window: number,
         *   throttling: 'limit-absolute' | 'limit-concurrency' | 'unlimited' | 'window-fixed' | 'window-sliding'
         * }
         */
        this._throttlingOptions = _.assign({
                limit: options.limit,
                window: options.window,
                onError: options.onError
            },
            _.isString(options.throttling) ? {
                type: options.throttling
            } :
            options.throttling
        );
        /** @type {Throttling} */
        this._Throttling = loader.loadThrottlingClass(this._throttlingOptions.type);
        if (!(this._Throttling.prototype instanceof Throttling)) {
            throw new Error('throttling needs to be of type Throttling');
        }

        /** @type {{ [key: string]: Throttling }} */
        this._throttling = {};

        if (!_.isUndefined(options.queueing)) {
            this._queueingOptions =
                _.isString(options.queueing) ? {
                    type: options.queueing
                } :
                options.queueing;

            this._Queueing = loader.loadQueueingClass(this._queueingOptions.type);
        }
    }

    get name() {
        return this.options.name;
    }

    get resource() {
        return this.options.resource;
    }

    limitsResource(resource) {
        if (!this.options.resource) {
            return true;
        }

        return (this.options.resource === resource);
    }

    isAvailable(scope, resources, options, queuedRequest) {
        const scopeBundle = this._getBundleForScope(scope);

        if (!_.isUndefined(this._Queueing) && !queuedRequest) {
            if (scopeBundle.queueing.getNumberWaiting() > 0) {
                return false;
            }
        }

        return scopeBundle.throttling.isAvailable(this._getResourceAmount(resources), options);
    }

    enqueue(managerName, scope, resources, options, queuedRequest) {
        if (_.isUndefined(this._Queueing)) {
            return null;
        }

        return new Promise((resolve, reject) => {
            const scopeBundle = this._getBundleForScope(scope);
            let queueingOp = 'add';

            if (!queuedRequest) {
                queuedRequest = {
                    valid: true,
                    process: () => {
                        return new Promise(resolveToProcessMore => {
                            queuedRequest.gotAddedAgainToSameQueue = resolveToProcessMore;
                            queuedRequest.previouslyQueuedForRule = this;
                            resolve(queuedRequest);
                        });
                    },
                    abort: () => {
                        queuedRequest.valid = false;
                        reject(new errors.OutOfQuotaError(managerName));
                        scopeBundle.moreAvailable();
                    }
                };

                if (options && _.isFinite(options.maxWait)) {
                    setTimeout(function () {
                        queuedRequest.abort();
                    }, options.maxWait + 5);
                }
            } else {
                queueingOp = (this === queuedRequest.previouslyQueuedForRule) ? 'addAgain' : 'add';
            }

            scopeBundle.queueing[queueingOp](queuedRequest);
        });
    }

    reserve(scope, resources, options) {
        return this
            ._getBundleForScope(scope)
            .throttling
            .reserve(this._getResourceAmount(resources), options);
    }

    // bundle(scope) {
    //     const scopeString = this._formatScope(scope);

    //     if (!this._throttling[scopeString]) {
    //         const options = {
    //             throttling: new this._Throttling({
    //                 ...this._throttlingOptions,
    //                 moreAvailable: scopeBundle.moreAvailable
    //             })
    //         };

    //         if (!_.isUndefined(this._Queueing)) {
    //             options.queueing = new this._Queueing(this._queueingOptions);
    //         }


    //     }

    //     return this._throttling[scopeString];
    // }

    _getBundleForScope(scope) {
        var scopeString = this._formatScope(scope);
        if (!this._throttling[scopeString]) {
            var scopeBundle = {
                moreAvailable: _.noop
            };

            if (!_.isUndefined(this._Queueing)) {
                scopeBundle.queueing = new this._Queueing(this._queueingOptions);
                scopeBundle.moreAvailable = function () {
                    if (scopeBundle.queueing.getNumberWaiting() === 0) {
                        return;
                    }

                    while (true) {
                        const queuedRequest = scopeBundle.queueing.next();
                        if (_.isUndefined(queuedRequest)) {
                            return;
                        }

                        if (!queuedRequest.valid) {
                            continue;
                        }

                        queuedRequest.process().then(gotAddedAgainToSameQueue => {
                            if (!gotAddedAgainToSameQueue) {
                                scopeBundle.moreAvailable();
                            }
                        });
                        break;
                    }
                };
            }

            scopeBundle.throttling = new this._Throttling({
                ...this._throttlingOptions,
                moreAvailable: scopeBundle.moreAvailable
            });

            this._throttling[scopeString] = scopeBundle;
        }

        return this._throttling[scopeString];
    }

    /**
     * 
     * @param {{ [resourceName: string]: number }} scope 
     * @returns {number}
     */
    _getResourceAmount(resources) {
        if (_.isUndefined(resources)) {
            return 1;
        } else if (_.isFinite(resources)) {
            return resources;
        }

        let resourceName = this.options.resource;

        // this is weird and is inconsistent but I'll look into it later.
        if (!resourceName) {
            const resourceNames = _.keys(resources);
            if (resourceNames.length === 0) {
                return 1;
            }

            // if we have more than one resource specified then throw an error,
            // otherwise use the first and only resource
            if(resourceNames.length === 1) {
                resourceName = resourceNames[0];
            } else {
                throw new Error('Please pass the resource parameter to your rules to allow requesting quota for mixed resource amounts');
            }
        }

        const amount = resources[resourceName];
        if (!_.isFinite(amount)) {
            throw new Error('Please pass a number to resources["' + resourceName.replace(/\\/g, '\\\\').replace(/\"/g, '\\"') + '"]');
        }
        return amount;
    }

    /**
     * Creates a single scope string out of the given scopes.
     * 
     * @param {{ [scopeName: string]: number }} scope 
     * @returns {string}
     */
    _formatScope(scope) {
        const scopeStrings = [];

        for (const scopeName of this.options.scope) {
            if (!scope || _.isUndefined(scope[scopeName])) {
                throw new Error(`Please pass a value for the "${scopeName}" scope with your quota request`);
            }

            scopeStrings.push(`${scope[scopeName]}`.replace(/\|/g, '||'));
        }

        return scopeStrings.join('|');
    }
}

module.exports = Rule;