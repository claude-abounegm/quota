'use strict';

const _ = require('lodash');

const ScopeBundle = require('../core/ScopeBundle');

const { unimplemented } = require('./utils');

class Throttling {
    constructor(options) {
        /** @type {ScopeBundle} */
        this.scopeBundle = options.scopeBundle;
        this.onError = options.onError;
    }

    /**
     * Checks whether this throttling profile has resources
     * available with the amount of resourceAmout.
     *
     * @param {number} resourceAmount
     * @returns {boolean}
     */
    isAvailable(resourceAmount = 1) {
        unimplemented(resourceAmount);
    }

    /**
     * reserve
     *
     * @param {number} resourceAmount
     * @returns {(feedback) => void}
     */
    reserve(resourceAmount) {
        unimplemented(resourceAmount);
    }

    saturate() {
        unimplemented();
    }

    feedbackHandler(cb) {
        return feedback => {
            if (feedback.error instanceof Error) {
                if (_.isFunction(this.onError)) {
                    this.onError(this, feedback.error);
                }
            }

            return cb(feedback);
        };
    }
}

module.exports = Throttling;
