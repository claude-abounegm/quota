'use strict';

const Throttling = require('./throttling/Throttling');
const Queueing = require('./queueing/Queueing');
const EventEmitter = require('events');

class ScopeBundle extends EventEmitter {
    constructor(ThrottlingFactory, QueueingFactory) {
        super();

        this._throttling = ThrottlingFactory();
        this._queueing = QueueingFactory();
    }

    /**
     * @returns {Throttling}
     */
    get throttling() {
        return this._throttling;
    }

    /**
     * @return {Queueing}
     */
    get queueing() {
        return this._queueing;
    }

    // moreAvailable() {
    //     if(!this.queueing) {
    //         return;
    //     }

    //     if (this.queueing.getNumberWaiting() === 0) {
    //         return;
    //     }

    //     while (true) {
    //         const queuedRequest = scopeBundle.queueing.next();
    //         if (_.isUndefined(queuedRequest)) {
    //             return;
    //         }

    //         if (!queuedRequest.valid) {
    //             continue;
    //         }

    //         queuedRequest.process().then(gotAddedAgainToSameQueue => {
    //             if (!gotAddedAgainToSameQueue) {
    //                 scopeBundle.moreAvailable();
    //             }
    //         });
    //         break;
    //     }
    // }
}

module.exports = ScopeBundle;