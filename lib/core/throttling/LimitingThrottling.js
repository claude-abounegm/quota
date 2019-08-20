'use strict';

const _ = require('lodash');
const Throttling = require('../../common/Throttling');

class LimitingThrottling extends Throttling {
    constructor(options) {
        super(options);

        if (!_.isObject(options)) {
            throw new Error('options needs to be an object');
        }

        options = _.assign(
            {
                used: 0,
                limit: 0,
                window: 0,
                moreAvailable: _.noop,
                getStartOfNextWindow: _.noop
            },
            options
        );

        this.hasFiniteLimit(options, true);

        if (!_.isFinite(options.used)) {
            throw new Error('options.used should be a finite number');
        }

        this.options = options;

        /** @type {number} */
        this.used = options.used;

        /** @type {number} */
        this.limit = options.limit;
    }

    /**
     * Checks whether this throttling profile has resources
     * available with the amount of resourceAmout.
     *
     * @param {number} resourceAmount
     * @returns {boolean}
     */
    isAvailable(resourceAmount = 1) {
        if (!_.isNumber(resourceAmount) || resourceAmount <= 0) {
            throw new Error('resourceAmount should be at least 1');
        }

        return this.used + resourceAmount <= this.limit;
    }

    checkIfMoreAvailable() {
        if (this.isAvailable()) {
            this.scopeBundle.moreAvailable();
        }
    }

    hasFiniteLimit(options, throwOnError) {
        let faultyLimit = false;
        if (_.isObject(options)) {
            const { limit } = options;

            if (!_.isUndefined(limit)) {
                // we only type check limit if it was provided
                if (_.isFinite(limit) && limit > 0) {
                    return true;
                }

                faultyLimit = true;
            }
        }

        if (faultyLimit || throwOnError) {
            throw new Error(
                'Please pass the limit parameter to allow throttling'
            );
        }

        return false;
    }

    saturate() {
        return this.reserve(this.limit - this.used);
    }
}

module.exports = LimitingThrottling;
