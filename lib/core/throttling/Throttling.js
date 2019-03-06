'use strict';

const {
    unimplemented
} = require('../../common/utils');

class Throttling {
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
     * @returns {boolean}
     */
    reserve(resourceAmount) {
        unimplemented(resourceAmount);
    }
}

module.exports = Throttling;