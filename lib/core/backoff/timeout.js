'use strict';

const _ = require('lodash');
const Backoff = require('../../common/Backoff');

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

    activate(e) {
        if (super.activate(e)) {
            this.nextWindow = Date.now() + this.options.delay;
            return true;
        }
    }
}

module.exports = Timeout;