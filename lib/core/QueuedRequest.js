'use strict';

const _ = require('lodash');

const errors = require('../common/errors');
const Rule = require('./Rule');
const ScopeBundle = require('./ScopeBundle');

class QueuedRequest {
    constructor({ managerName, scopeBundle, rule, resolve, reject }) {
        /** @type {string} */
        this.managerName = managerName;
        /** @type {ScopeBundle} */
        this.scopeBundle = scopeBundle;
        this.rule = rule;

        /** @type {(value?: any) => void} */
        this.resolve = resolve;
        /** @type {(e?: Error) => void} */
        this.reject = reject;

        /** @type {Rule} */
        this.previouslyQueuedForRule = null;
        this.valid = true;
    }

    get isValid() {
        return this.valid;
    }

    /**
     * @returns {void}
     */
    process() {
        this.previouslyQueuedForRule = this.rule;
        this.resolve(this);
    }

    /**
     * 
     * @param {string} managerName 
     */
    abort() {
        this.valid = false;
        this.reject(new errors.OutOfQuotaError(this.managerName));
        this.scopeBundle.moreAvailable();
    }

    /**
     * 
     * @param {*} options 
     * @param {QueuedRequest} queuedRequest 
     * @returns {Promise<QueuedRequest>}
     */
    static enqueue(reqOpts, options, queuedRequest) {
        return new Promise((resolve, reject) => {
            let queueingOp = 'add';

            if (!queuedRequest) {
                queuedRequest = new QueuedRequest({
                    ...reqOpts,
                    resolve,
                    reject
                });

                if (options && _.isFinite(options.maxWait)) {
                    setTimeout(() => {
                        queuedRequest.abort();
                    }, options.maxWait + 2);
                }
            } else if(reqOpts.rule === queuedRequest.previouslyQueuedForRule) {
                queueingOp = 'addAgain';
            }

            queuedRequest.scopeBundle.queueing[queueingOp](queuedRequest);
        });
    }
}

module.exports = QueuedRequest;