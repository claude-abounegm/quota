'use strict';

const _ = require('lodash');
const LimitingThrottling = require('./LimitingThrottling');

class LimitAbsolute extends LimitingThrottling {
    constructor(options) {
        super(options);
    }

    reserve(resourceAmount) {
        this.used += resourceAmount;

        return feedback => {
            if (this.hasFiniteLimit(feedback)) {
                this.limit = feedback.limit;
                this.checkIfMoreAvailable();
            }
        };
    }
}

module.exports = LimitAbsolute;