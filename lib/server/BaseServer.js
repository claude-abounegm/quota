'use strict';

const {
    unimplemented
} = require('../common/utils');

class BaseServer {
    dispose() {}

    async getManagers() {
        unimplemented();
    }

    async requestQuota() {
        unimplemented();
    }

    /**
     * 
     * @param {string} managerName 
     * @param {Error}} e 
     */
    reportError(managerName, e) {
        unimplemented(managerName, e);
    }
}

module.exports = BaseServer;