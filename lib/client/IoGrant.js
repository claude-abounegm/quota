'use strict';

const _ = require('lodash');

const {
    errorToIo
} = require('../common/utils');

const BaseGrant = require('../common/BaseGrant');

class IoGrant extends BaseGrant {
    constructor(api, grantId) {
        super();

        this.api = api;
        this.grantId = grantId;
    }

    dismiss(feedback) {
        if (feedback && feedback.error instanceof Error) {
            feedback.error = errorToIo(feedback.error);
        }

        return this.api._request('quota.dismissGrant', _.noop, {
            grantId: this.grantId,
            feedback
        });
    }
}

module.exports = IoGrant;