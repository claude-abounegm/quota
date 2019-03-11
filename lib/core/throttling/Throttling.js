'use strict';

const _ = require('lodash');
const Rule = require('../Rule');

const {
    unimplemented
} = require('../../common/utils');

class Throttling {
    constructor(options) {
        this._onError = options.onError;
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
     * @returns {(feedback) => void)}
     */
    reserve(resourceAmount) {
        unimplemented(resourceAmount);
    }

    saturate() {
        unimplemented();
    }

    /**
     * @param {Rule} rule
     * @param {Error} e
     */
    onError(rule, e) {
        if(_.isFunction(this._onError)) {
            return this._onError(rule, this, e);
        }
    }
}

module.exports = Throttling;