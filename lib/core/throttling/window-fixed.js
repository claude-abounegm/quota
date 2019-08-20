'use strict';

// Possible strategies: cutoff, linear-remaining, twice-average-remaining
// Currently implemented strategy: cuttoff
// A more linear strategy can be produced by just dividing the limit by a certain factor and returning shorter intervals with getStartOfNextWindow.

const _ = require('lodash');
const LimitingThrottling = require('./LimitingThrottling');

class FixedWindow extends LimitingThrottling {
    constructor(options) {
        super(options);

        options = this.options;
        this.getStartOfNextWindow = options.getStartOfNextWindow;
        this._prepareNextWindow();
    }

    reserve(resourceAmount) {
        this.used += resourceAmount;

        return this.feedbackHandler(feedback => {
            if (this.hasFiniteLimit(feedback)) {
                this.limit = feedback.limit;
                this.checkIfMoreAvailable();
            }
        });
    }

    _prepareNextWindow() {
        const later = this.getStartOfNextWindow();
        const now = new Date().getTime();

        setTimeout(() => {
            this.used = 0;
            this._prepareNextWindow();
            this.scopeBundle.moreAvailable();
        }, later - now).unref();
    }
}

module.exports = FixedWindow;
