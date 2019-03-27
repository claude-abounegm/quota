'use strict';

const _ = require('lodash');
const EventEmitter = require('events');

const QueuedRequest = require('./queueing/QueuedRequest');

const Queueing = require('./queueing/Queueing');
const Throttling = require('./throttling/Throttling');

class ScopeBundle extends EventEmitter {
    constructor(ThrottlingFactory, QueueingFactory) {
        super();

        this._throttling = ThrottlingFactory(this);
        if(QueueingFactory) {
            this._queueing = QueueingFactory(this);
        }
    }

    /**
     * @returns {Throttling}
     */
    get throttling() {
        return this._throttling;
    }

    /**
     * @returns {Queueing}
     */
    get queueing() {
        return this._queueing;
    }

    moreAvailable() {
        if(!this.queueing) {
            return;
        }

        if (this.queueing.getNumberWaiting() === 0) {
            return;
        }

        /** @type {QueuedRequest} */
        let queuedRequest;
        while (!_.isUndefined(queuedRequest = this.queueing.next())) {
            if (!queuedRequest.isValid) {
                continue;
            }

            queuedRequest.process();
            break;
        }
    }
}

module.exports = ScopeBundle;