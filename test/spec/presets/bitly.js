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

describe('Preset Bitly', function() {
    it('should allow 5 concurrent requests', async function() {
        const quotaServer = new quota.Server({
            bitly: {
                preset: 'bitly'
            }
        });

        const quotaClient = new quota.Client(quotaServer);

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

        await shouldThrowOutOfQuota(() =>
            quotaClient.requestQuota('bitly', undefined, undefined, {
                maxWait: 0
            })
        );
    });

    it('shared ip addresses', async function() {
        const quotaServer = new quota.Server({
            bitly: {
                preset: 'bitly',
                sharedIPAddress: true
            }
        });

        const quotaClient = new quota.Client(quotaServer);

        await Promise.all([
            quotaClient.requestQuota(
                'bitly',
                {
                    ipAddress: '192.168.0.1'
                },
                undefined,
                {
                    maxWait: 0
                }
            ),
            quotaClient.requestQuota(
                'bitly',
                {
                    ipAddress: '192.168.0.1'
                },
                undefined,
                {
                    maxWait: 0
                }
            ),
            quotaClient.requestQuota(
                'bitly',
                {
                    ipAddress: '192.168.0.1'
                },
                undefined,
                {
                    maxWait: 0
                }
            ),
            quotaClient.requestQuota(
                'bitly',
                {
                    ipAddress: '192.168.0.1'
                },
                undefined,
                {
                    maxWait: 0
                }
            ),
            quotaClient.requestQuota(
                'bitly',
                {
                    ipAddress: '192.168.0.1'
                },
                undefined,
                {
                    maxWait: 0
                }
            ),
            quotaClient.requestQuota(
                'bitly',
                {
                    ipAddress: '192.168.0.2'
                },
                undefined,
                {
                    maxWait: 0
                }
            )
        ]);

        shouldThrowOutOfQuota(() =>
            quotaClient.requestQuota(
                'bitly',
                {
                    ipAddress: '192.168.0.1'
                },
                undefined,
                {
                    maxWait: 0
                }
            )
        );
    });
});
