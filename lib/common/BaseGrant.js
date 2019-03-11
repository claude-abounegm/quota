'use strict';

const {
    unimplemented
} = require('./utils');

class BaseGrant {
    /**
     * Dismisses the reserved quota spot to be used again.
     * 
     * @param {{ error?: Error, forRule: { [ruleName: string]: { error?: Error, limit?: number } } }} feedback 
     */
    dismiss(feedback) {
        unimplemented(feedback);
    }
}

module.exports = BaseGrant;
