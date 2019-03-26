'use strict';

const Backoff = require('./Backoff');

class Timeout extends Backoff {
    constructor() {
        super();

        this.delay = 1000;
        this.nextWindow = Date.now();
    }

    set() {
        this.nextWindow = Date.now() + this.delay;
    }

    wait() {
        const now = Date.now();
        if (now - this.nextWindow >= 0) {
            return true;
        }

        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, this.nextWindow - now)
        });
    }
}

module.exports = Timeout;