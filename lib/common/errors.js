'use strict';

class NoManagerError extends Error {
    constructor(managerName) {
        super(`No manager with the name ${managerName} found`);
        this.name = 'NoManagerError';
        this.managerName = managerName;
    }
}

class OutOfQuotaError extends Error {
    constructor(managerName) {
        super(`Ran out of quota for ${managerName}`);
        this.name = 'OutOfQuotaError';
        this.managerName = managerName;
    }
}

module.exports = {
    NoManagerError,
    OutOfQuotaError
};