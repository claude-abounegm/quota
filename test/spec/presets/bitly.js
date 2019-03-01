'use strict';

const quota = require('../../../lib/index.js');
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

describe('Preset Bitly', function () {
    it('should allow 5 concurrent requests', async function () {
        var quotaServer = new quota.Server();
        quotaServer.addManager('bitly');

        var quotaClient = new quota.Client(quotaServer);

        await Promise.all([
            quotaClient.requestQuota('bitly', undefined, undefined, {
                maxWait: 0
            }),
            quotaClient.requestQuota('bitly', undefined, undefined, {
                maxWait: 0
            }),
            quotaClient.requestQuota('bitly', undefined, undefined, {
                maxWait: 0
            }),
            quotaClient.requestQuota('bitly', undefined, undefined, {
                maxWait: 0
            }),
            quotaClient.requestQuota('bitly', undefined, undefined, {
                maxWait: 0
            })
        ]);

        await shouldThrowOutOfQuota(() => quotaClient.requestQuota('bitly', undefined, undefined, {
            maxWait: 0
        }));
    });
});
