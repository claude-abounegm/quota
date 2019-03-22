'use strict';

const _ = require('lodash');

const Throttling = require('./throttling/Throttling');
const QueuedRequest = require('../core/queueing/QueuedRequest');
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
            throw new Error('Please pass either undefined, a string, or an array of strings to options.scope');
        }

        if (!_.isUndefined(options.resource) && !_.isString(options.resource)) {
            throw new Error('Please pass either undefined or a string to options.resource');
        }

        if (_.isString(options.throttling)) {
            options.throttling = {
                type: options.throttling
            };
        }

        options.throttling = _.assign({},
            _.pick(options, ['limit', 'window', 'onError']),
            options.throttling
        );

        if (_.isString(options.queueing)) {
            options.queueing = {
                type: options.queueing
            };
        }

        this.ThrottlingFactory = loader.loadThrottlingFactory(options.throttling);
        if (options.queueing) {
            this.QueueingFactory = loader.loadQueueingFactory(options.queueing);
        }

        /** @type {{ [key: string]: ScopeBundle }} */
        this._bundles = {};
        this.options = options;
    }

    get name() {
        return this.options.name;
    }

    get resource() {
        return this.options.resource;
    }

    enqueue(managerName, scope, options, queuedRequest) {
        const scopeBundle = this._getBundleForScope(scope);

        if (!scopeBundle.queueing) {
            throw new errors.OutOfQuotaError(managerName);
        }

        return QueuedRequest.enqueue({
            rule: this,
            managerName,
            scopeBundle
        }, options, queuedRequest);
    }

    reserve(scope, resources) {
        const scopeBundle = this._getBundleForScope(scope);
        const amount = this._getResourceAmount(resources);

        return scopeBundle.throttling.reserve(amount);
    }

    limitsResource(resource) {
        return !this.options.resource || (this.options.resource === resource);
    }

    /**
     * 
     * @param {*} scope 
     * @param {*} resources 
     * @param {QueuedRequest} queuedRequest 
     */
    isAvailable(scope, resources, queuedRequest) {
        const scopeBundle = this._getBundleForScope(scope);

        if (scopeBundle.queueing && !queuedRequest) {
            if (scopeBundle.queueing.getNumberWaiting() > 0) {
                return false;
            }
        }

        const amount = this._getResourceAmount(resources);
        return scopeBundle.throttling.isAvailable(amount);
    }

    /**
     * 
     * @param { { [scopeName: string]: string } } scope 
     * @returns {ScopeBundle}
     */
    _getBundleForScope(scope) {
        const bundles = this._bundles;

        const scopeString = this._formatScope(scope);
        if (!bundles[scopeString]) {
            bundles[scopeString] = new ScopeBundle(this.ThrottlingFactory, this.QueueingFactory);
        }
        return bundles[scopeString];
    }

    /**
     * 
     * @param {{ [resourceName: string]: number }} resources 
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
            if (resourceNames.length === 1) {
                resourceName = resourceNames[0];
            } else {
                throw new Error('Please pass the resource parameter to your rules to allow requesting quota for mixed resource amounts');
            }
        }

        const amount = resources[resourceName];
        if (!_.isFinite(amount)) {
            throw new Error(`Please pass a number to resources["${resourceName.replace(/\\/g, '\\\\').replace(/\"/g, '\\"')}"]`);
        }
        return amount;
    }

    /**
     * Creates a single scope string out of the given scopes.
     * 
     * @param {{ [scopeName: string]: string }} scope 
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