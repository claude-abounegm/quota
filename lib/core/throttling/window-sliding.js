'use strict';

// Possible strategies: linear, cutoff, something in between
// Currently implemented strategy: cuttoff
// A more linear strategy can be produced by just dividing the limit and the window by a certain factor.

const _ = require('lodash');
const LimitingThrottling = require('./LimitingThrottling');

class SlidingWindow extends LimitingThrottling {
    constructor(options) {
        super(options);

        options = this.options;
        this.window = options.window;
    }

    reserve(resourceAmount) {
        this.used += resourceAmount;

        setTimeout(() => {
            this.used -= resourceAmount;
            this.checkIfMoreAvailable();
        }, this.window).unref();

        return feedback => {
            if (this.hasFiniteLimit(feedback)) {
                this.limit = feedback.limit;
                this.checkIfMoreAvailable();
            }
        };
    }
}

module.exports = SlidingWindow;