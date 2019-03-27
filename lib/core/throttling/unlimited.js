'use strict';

const Throttling = require('../../common/Throttling');

class Unlimited extends Throttling {
    constructor() {
        super({});
    }

    isAvailable() {
        return true;
    }
    reserve() {}
    saturate() {}
}

module.exports = Unlimited;