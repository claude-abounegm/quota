'use strict';

const _ = require('lodash');

const Rule = require('./Rule');
const Grant = require('./Grant');
const QueuedRequest = require('./QueuedRequest');
const loader = require('./loader');
const errors = require('../common/errors');

class Manager {
    constructor(options, manager) {
        /**
         * @type {Rule[]}
         */
        this._rules = [];
        /**
         * @type {string[]}
         */
        this.resources = [];
        this.options = options || {};

        this.name = this.options.name;

        if (manager instanceof Manager) {
            for (const rule of manager.rules) {
                this.addRule(rule);
            }
        }

        const { rules } = this.options;

        if (_.isArray(rules)) {
            for (const rule of rules) {
                this.addRule(rule);
            }
        }

        if (this.options.backoff) {
            let { backoff: options } = this.options;

            if (_.isString(options)) {
                options = {
                    type: options
                };
            }

            if (!_.isPlainObject(options)) {
                throw new Error('backoff should be an object');
            }

            this._backoff = loader.loadBackoff(options);
        }
    }

    get rules() {
        return this._rules;
    }

    get backoff() {
        return this._backoff;
    }

    getRule(name) {
        return this.rules.find(rule => rule.name === name);
    }

    addRule(ruleOrOptions) {
        /** @type {Rule} */
        let rule = ruleOrOptions;

        if (!(ruleOrOptions instanceof Rule)) {
            rule = new Rule(ruleOrOptions);
        }

        this._rules.push(rule);

        const resource = rule.resource;
        if (resource && !_.includes(this.resources, resource)) {
            this.resources.push(resource);
        }

        return rule;
    }

    /**
     *
     * @param {*} scope
     * @param {*} resources
     * @param {*} options
     * @param {QueuedRequest} queuedRequest
     */
    requestQuota(scope, resources, options, queuedRequest) {
        if (!_.isUndefined(scope) && !_.isPlainObject(scope)) {
            throw new Error(
                'Please pass either undefined or an object to the scope parameter.'
            );
        }

        if (
            !_.isUndefined(resources) &&
            !_.isPlainObject(resources) &&
            !_.isFinite(resources)
        ) {
            throw new Error(
                'Please pass either undefined, a number, or an object to the resources parameter.'
            );
        } else if (this.resources.length > 1 && !_.isPlainObject(resources)) {
            throw new Error(
                'Please request quota for a selection of the following resources: ' +
                    this.resources.join(', ')
            );
        }

        if (!_.isUndefined(options) && !_.isPlainObject(options)) {
            throw new Error(
                'Please pass either undefined or an object to the options parameter.'
            );
        }

        return new Promise(async (resolve, reject) => {
            /**
             * @type {Rule[]}
             */
            let relevantRules;

            if (_.isPlainObject(resources)) {
                relevantRules = [];

                for (const rule of this.rules) {
                    _.keys(resources).find(resourceName => {
                        if (rule.limitsResource(resourceName)) {
                            relevantRules.push(rule);
                            return true;
                        }
                    });
                }
            } else {
                relevantRules = this.rules;
            }

            if (relevantRules.length === 0) {
                return reject(
                    new Error(
                        'Please request quota for at least one of the following resources: ' +
                            this.resources.join(', ')
                    )
                );
            }

            try {
                if (this.backoff && !(await this.backoff.waitIfNecessary())) {
                    throw new errors.BackoffLimitError(this.name);
                }

                // TODO: FIX RACE CONDITION I CANT FIND IT
                let qr = queuedRequest;
                for (const rule of relevantRules) {
                    if (!rule.isAvailable(scope, resources, qr)) {
                        qr = await rule.enqueue(
                            scope,
                            options,
                            qr
                        );

                        if (!qr || !qr.isValid) {
                            // Between the call of queuedRequest.process() and enqueueing the request again the abort timer may have fired!
                            throw new errors.OutOfQuotaError(this.name);
                        } else if (
                            rule !== qr.previouslyQueuedForRule
                        ) {
                            qr.scopeBundle.moreAvailable();
                        }

                        return this.requestQuota(
                            scope,
                            resources,
                            options,
                            qr
                        ).then(resolve, reject);
                    }
                }
            } catch (e) {
                return reject(e);
            }

            const dismissCallbacks = [];
            for (const rule of relevantRules) {
                const callback = rule.reserve(scope, resources);

                if (_.isFunction(callback)) {
                    dismissCallbacks.push({
                        rule,
                        callback
                    });
                }
            }

            resolve(new Grant(this, dismissCallbacks));
        });
    }
}

module.exports = Manager;
