'use strict';

const _ = require('lodash');
const Backoff = require('./Backoff');

class Timeout extends Backoff {
    constructor(options) {
        // https://developers.google.com/analytics/devguides/reporting/core/v3/errors#backoff

        super(_.assign({
            limit: 5
        }, options));
    }

    reset() {
        super.reset();
        this.accumulator = 1;
    }

    activate(e) {
        if (super.activate(e)) {
            this.accumulator *= 2;
            this.nextWindow = this.accumulator * 1000 + Math.random() + Date.now();
            return true;
        }

        return false;
    }
}

module.exports = Timeout;