'use strict';

const _ = require('lodash');
const BaseGrant = require('./BaseGrant');
const Manager = require('./Manager');

class Grant extends BaseGrant {
    constructor(manager, dismissCallbacks) {
        super();

        /** @type {Manager} */
        this.manager = manager;
        this.dismissCallbacks = dismissCallbacks;
    }

    /**
     * Dismisses the reserved quota spot to be used again.
     * 
     * @param {{ error?: Error, forRule: { [ruleName: string]: { limit?: number } } }} feedback 
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

        if (error) {
            const backoff = this.manager.backoff;
            if (backoff) {
                backoff.activate(error);
            }
        }

        // TODO: Call manager for backoff etc.
        for (const {
                rule,
                callback
            } of this.dismissCallbacks) {

            const ruleFeedback = {};

            const ruleName = rule.name;
            if (ruleName && _.isPlainObject(forRule[ruleName])) {
                Object.assign(ruleFeedback, forRule[ruleName]);
            }

            ruleFeedback.error = error;

            callback(ruleFeedback);
        }
    }
}

module.exports = Grant;
