'use strict';

const _ = require('lodash');

const Rule = require('./Rule');
const ScopeBundle = require('./ScopeBundle');

class QueuedRequest {
    constructor(options) {
        /** @type {ScopeBundle} */
        this.scopeBundle = options.scopeBundle;

        /** @type {Rule} */
        this.previouslyQueuedForRule = options.previouslyQueuedForRule;

        this._valid = true;
        this.setData(options);
    }

    setData({ rule, resolve, reject }) {
        /** @type {Rule} */
        this.rule = rule;
        /** @type {(value?: any) => void} */
        this.resolve = resolve;
        /** @type {(e?: Error) => void} */
        this.reject = reject;
    }

    get isValid() {
        return this._valid;
    }

    /**
     * @returns {void}
     */
    process() {
        this.previouslyQueuedForRule = this.rule;
        this.resolve(this);
        this.resolve = _.noop;
        this.reject = _.noop;
    }

    abort() {
        this._valid = false;
        this.scopeBundle.moreAvailable();
        this.resolve(false);
        this.resolve = _.noop;
        this.reject = _.noop;
    }
}

module.exports = QueuedRequest;