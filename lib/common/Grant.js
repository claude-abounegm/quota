'use strict';

const _ = require('lodash');
const BaseGrant = require('./BaseGrant');

class Grant extends BaseGrant {
    constructor(manager, dismissCallbacks) {
        super();

        this.manager = manager;
        this.dismissCallbacks = dismissCallbacks;
    }

    /**
     * Dismisses the reserved quota spot to be used again.
     * 
     * @param {{ error?: Error, forRule: { [ruleName: string]: { error?: Error, limit?: number } } }} feedback 
     */
    dismiss(feedback) {
        if (!_.isPlainObject(feedback)) {
            if (feedback) {
                throw new Error('Please pass an object to grant.dismiss(...)');
            }

            feedback = {};
        }

        const {
            error,
            forRule = {}
        } = feedback;

        // TODO: Call manager for backoff etc.
        for (const {
                rule,
                callback
            } of this.dismissCallbacks) {

            const ruleFeedback = {
                error
            };

            const ruleName = rule.name;
            if (ruleName && _.isPlainObject(forRule[ruleName])) {
                Object.assign(ruleFeedback, forRule[ruleName]);
            }

            callback(ruleFeedback);
        }
    }
}

module.exports = Grant;
