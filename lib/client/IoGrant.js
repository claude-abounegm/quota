'use strict';

const _ = require('lodash');

const {
    errorToIo,
    ioToError
} = require('../common/utils');

const BaseGrant = require('../common/BaseGrant');

class IoGrant extends BaseGrant {
    constructor(socket, grantId) {
        super();

        this.socket = socket;
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

        this.socket.emit('quota.dismissGrant', {
            grantId: this.grantId,
            feedback
        });
    }
}

module.exports = IoGrant;