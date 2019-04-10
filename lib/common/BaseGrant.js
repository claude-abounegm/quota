'use strict';

const {
    unimplemented
} = require('../common/utils');

class BaseGrant {
    /**
     * Dismisses the reserved quota spot to be used again.
     * 
     * @param {{ error?: Error, forRule: { [ruleName: string]: { limit?: number } } }} feedback 
     * 
     * @returns {void}
     */
    dismiss(feedback) {
        unimplemented(feedback);
    }
}

module.exports = BaseGrant;