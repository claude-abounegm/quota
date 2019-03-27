'use strict';

const _ = require('lodash');
const Backoff = require('./Backoff');

class Timeout extends Backoff {
    constructor(options) {
        super(_.assign({
            delay: 1000,
            limit: 10
        }, options));

        if (!_.isNumber(this.options.delay)) {
            throw new Error('delay should be a number');
        }
    }

    activate() {
        if (super.activate()) {
            this.nextWindow = Date.now() + this.options.delay;
            return true;
        }
        return false;
    }
}

module.exports = Timeout;