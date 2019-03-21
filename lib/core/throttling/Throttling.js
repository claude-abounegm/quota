'use strict';

const EventEmitter = require('events');
const _ = require('lodash');

const {
    unimplemented
} = require('../../common/utils');

class Throttling extends EventEmitter {
    constructor(options) {
        super();

        // if (_.isFunction(options.onError)) {
        //     this.on('error', options.onError);
        // }
        this._onError = options.onError;
    }

    /**
     * Checks whether this throttling profile has resources
     * available with the amount of resourceAmout.
     * 
     * @param {number} resourceAmount 
     * @returns {boolean}
     */
    isAvailable(resourceAmount = 1) {
        unimplemented(resourceAmount);
    }

    /**
     * reserve
     * 
     * @param {number} resourceAmount 
     * @returns {(feedback) => void)}
     */
    reserve(resourceAmount) {
        unimplemented(resourceAmount);
    }

    saturate() {
        unimplemented();
    }

    feedbackHandler(cb) {
        return feedback => {
            if (feedback.error instanceof Error) {
                // this.emit('error', this, feedback.error);
                if(_.isFunction(this._onError)) {
                    this._onError(this, feedback.error);
                }
            }

            return cb(feedback);
        };
    }
}

module.exports = Throttling;