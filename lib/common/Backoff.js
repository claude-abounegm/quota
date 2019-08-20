'use strict';

const _ = require('lodash');
const util = require('util');
const setTimeoutPromise = util.promisify(setTimeout);

class Backoff {
    constructor(options) {
        options = _.assign(
            {
                limit: false,
                shouldBackoff: () => true
            },
            options
        );

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

    /**
     *
     * @param {Error} e
     * @returns {boolean}
     */
    activate(e) {
        if (this.options.shouldBackoff(e)) {
            this.active = true;
            this.count += 1;
            this.nextWindow = 0;
            return true;
        }
    }

    async waitIfNecessary() {
        const now = Date.now();

        if (!this.active) {
            return true;
        } else if (_.isFinite(this.limit) && this.count > this.limit) {
            return false;
        }

        if (now - this.nextWindow >= 0) {
            this.reset();
            return true;
        }

        await setTimeoutPromise(this.nextWindow - now);
        this.active = false;
        return true;
    }
}

module.exports = Backoff;
