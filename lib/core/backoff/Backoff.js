'use strict';

const _ = require('lodash');

class Backoff {
    constructor(options) {
        options = _.assign({
            limit: false,
            shouldBackoff: e => true
        }, options);

        /** @type {{ limit: false | number; shouldBackoff: (e?: Error) => boolean }} */
        this.options = options;

        if (typeof options.shouldBackoff !== 'function') {
            throw new Error('shouldBackoff must be a function');
        }

        if (options.limit !== false && !_.isNumber(options.limit)) {
            throw new Error('limit should be false or a number');
        }

        this.reset();
    }

    reset() {
        this.active = false;
        this.count = 0;
        this.nextWindow = 0;
    }

    activate(e) {
        if (this.options.shouldBackoff(e)) {
            this.active = true;
            this.count += 1;
            this.nextWindow = 0;
            return true;
        }
        return false;
    }

    waitIfNecessary() {
        const now = Date.now();

        return new Promise(resolve => {
            if (!this.active) {
                return resolve();
            } else if (_.isFinite(this.limit) && this.count > this.limit) {
                return reject(new Error('backoff error'));
            }

            if (now - this.nextWindow >= 0) {
                this.reset();
                return resolve();
            }

            setTimeout(() => {
                resolve();
            }, this.nextWindow - now);
        });
    }
}

module.exports = Backoff;