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

describe('Preset Twitter', function() {
    it('should grant quota for individual endpoints and each user', function() {
        const quotaServer = new quota.Server({
            twitter: {
                preset: 'twitter'
            }
        });

        const quotaClient = new quota.Client(quotaServer);
        return Promise.all([
            quotaClient.requestQuota(
                'twitter',
                {
                    userId: 1
                },
                {
                    'account/settings': 15
                },
                {
                    maxWait: 0
                }
            ),
            shouldThrowOutOfQuota(() =>
                quotaClient.requestQuota(
                    'twitter',
                    {
                        userId: 1
                    },
                    {
                        'account/settings': 15
                    },
                    {
                        maxWait: 0
                    }
                )
            ),
            quotaClient.requestQuota(
                'twitter',
                {
                    userId: 2
                },
                {
                    'account/settings': 15
                },
                {
                    maxWait: 0
                }
            ),
            shouldThrowOutOfQuota(() =>
                quotaClient.requestQuota(
                    'twitter',
                    {
                        userId: 2
                    },
                    {
                        'account/settings': 15
                    },
                    {
                        maxWait: 0
                    }
                )
            ),
            quotaClient.requestQuota(
                'twitter',
                {
                    userId: 1
                },
                {
                    'account/verify_credentials': 15
                },
                {
                    maxWait: 0
                }
            ),
            shouldThrowOutOfQuota(() =>
                quotaClient.requestQuota(
                    'twitter',
                    {
                        userId: 1
                    },
                    {
                        'account/verify_credentials': 15
                    },
                    {
                        maxWait: 0
                    }
                )
            )
        ]);
    });
});
