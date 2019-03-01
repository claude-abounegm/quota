'use strict';

const quota = require('../../../lib');
const _ = require('lodash');

async function shouldThrowOutOfQuota(fn) {
    try {
        await fn();
        throw new Error('Expected OutOfQuotaError');
    } catch (e) {
        if (!(e instanceof quota.OutOfQuotaError)) {
            throw e;
        }
    }
}

describe('Loading presets', function () {
    it('should allow setting a custom manager name', function () {
        const quotaServer = new quota.Server({
            'bitly1': {
                preset: 'bitly'
            },
            'bitly2': {
                preset: 'bitly'
            }
        });

        const quotaClient = new quota.Client(quotaServer);

        return Promise.all([
            quotaClient.requestQuota('bitly1', {}, { requests:5 }, { maxWait: 0 }),
            shouldThrowOutOfQuota(() => quotaClient.requestQuota('bitly1', {}, { requests:5 }, { maxWait: 0 })),
            quotaClient.requestQuota('bitly2', {}, { requests:5 }, { maxWait: 0 }),
            shouldThrowOutOfQuota(() => quotaClient.requestQuota('bitly2', {}, { requests:5 }, { maxWait: 0 }))
        ]);
    });
});
