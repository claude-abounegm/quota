'use strict';

const Deque = require('double-ended-queue');

const Queueing = require('../../common/Queueing');
// const QueuedRequest = require('./QueuedRequest');

class Fifo extends Queueing {
    constructor() {
        super();

        this._deque = new Deque();
    }

    add(item) {
        this._deque.push(item);
    }

    addAgain(item) {
        this._deque.unshift(item);
    }

    next() {
        return this._deque.shift();
    }

    getNumberWaiting() {
        return this._deque.length;
    }
}

module.exports = Fifo;
