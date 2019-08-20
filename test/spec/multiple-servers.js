'use strict';

const _ = require('lodash');
const quota = require('../../lib');

const { expect } = require('chai');

async function shouldThrowNoManager(fn) {
    try {
        await fn();
        throw new Error('Expected NoManagerError');
    } catch (e) {
        if (!(e instanceof quota.NoManagerError)) {
            throw e;
        }
    }
}

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

describe('Multiple Servers', function() {
    describe('edge cases', function() {
        it('no servers', function() {
            expect(function() {
                return new quota.Client();
            }).to.throw();
        });

        it('requesting quota for unknown manager', async function() {
            const quotaServer1 = new quota.Server({
                server1: new quota.Manager({
                    rules: [
                        {
                            limit: 1,
                            throttling: 'limit-absolute'
                        }
                    ]
                })
            });

            const quotaServer2 = new quota.Server({
                server2: new quota.Manager({
                    rules: [
                        {
                            limit: 1,
                            throttling: 'limit-absolute'
                        }
                    ]
                }),
                server3: new quota.Manager({
                    rules: [
                        {
                            limit: 1,
                            throttling: 'limit-absolute'
                        }
                    ]
                })
            });

            const quotaClient = new quota.Client([quotaServer1, quotaServer2]);

            await shouldThrowNoManager(() =>
                quotaClient.requestQuota('unknown')
            );
        });
    });

    describe('two local servers', function() {
        it('independent', async function() {
            const quotaServer1 = new quota.Server({
                server1: new quota.Manager({
                    rules: [
                        {
                            limit: 1,
                            throttling: 'limit-absolute'
                        }
                    ]
                })
            });

            const quotaServer2 = new quota.Server({
                server2: new quota.Manager({
                    rules: [
                        {
                            limit: 1,
                            throttling: 'limit-absolute'
                        }
                    ]
                })
            });

            const quotaClient = new quota.Client([quotaServer1, quotaServer2]);

            await quotaClient.requestQuota('server1');
            await shouldThrowOutOfQuota(() =>
                quotaClient.requestQuota('server1')
            );

            await quotaClient.requestQuota('server2');
            await shouldThrowOutOfQuota(() =>
                quotaClient.requestQuota('server2')
            );
        });
    });
});
