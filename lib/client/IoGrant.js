'use strict';

const _ = require('lodash');

const {
    errorToIo
} = require('../common/utils');

const BaseGrant = require('../core/BaseGrant');

class IoGrant extends BaseGrant {
    constructor(api, grantId) {
        super();

        this.api = api;
        this.grantId = grantId;
    }

    dismiss(feedback) {
        if (feedback) {
            if (feedback.error instanceof Error) {
                feedback.error = errorToIo(feedback.error);
            }

            if (feedback.forRule) {
                for (const [, value] of _.toPairs(feedback.forRule)) {
                    if (value.error instanceof Error) {
                        value.error = errorToIo(value.error);
                    }
                }
            }
        }

        return this.api._request('quota.dismissGrant', _.noop, {
            grantId: this.grantId,
            feedback
        });
    }
}

module.exports = IoGrant;