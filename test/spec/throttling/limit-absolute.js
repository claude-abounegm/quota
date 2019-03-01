'use strict';

const _ = require('lodash');
const {
    expect
} = require('chai');

const quota = require('../../../lib');

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

describe('Throttling LimitAbsolute', function () {
    it('should validate options.limit', function () {
        const quotaServer = new quota.Server({
            'test': new quota.Manager({
                rules: [{
                    throttling: 'limit-absolute'
                }]
            })
        });

        const quotaClient = new quota.Client(quotaServer);
        return shouldThrowOutOfQuota(() => quotaClient.requestQuota('test'))
            .catch(function (err) {
                expect(err.message).to.eql('Please pass the limit parameter to allow limit-absolute throttling');
            });
    });

    it('should allow increasing the limit', async function () {
        const quotaServer = new quota.Server({
            'test': new quota.Manager({
                rules: [{
                    name: 'main',
                    limit: 1,
                    throttling: 'limit-absolute',
                    queueing: 'fifo'
                }]
            })
        });

        const quotaClient = new quota.Client(quotaServer);

        let grant = await quotaClient.requestQuota('test');
        setTimeout(function () {
            grant.dismiss({
                forRule: {
                    main: {
                        limit: 3
                    }
                }
            });
        }, 5);
        await quotaClient.requestQuota('test');

        grant = await quotaClient.requestQuota('test');
        try {
            grant.dismiss({
                forRule: {
                    main: {
                        limit: NaN
                    }
                }
            });
            throw new Error('should throw');
        } catch (e) {}

        await shouldThrowOutOfQuota(() => quotaClient.requestQuota('test', undefined, undefined, {
            maxWait: 0
        }));
    });

    it('should allow decreasing the limit', async function () {
        const quotaServer = new quota.Server({
            'test': new quota.Manager({
                rules: [{
                    name: 'main',
                    limit: 2,
                    throttling: 'limit-absolute',
                    queueing: 'fifo'
                }]
            })
        });

        const quotaClient = new quota.Client(quotaServer);

        const grant = await quotaClient.requestQuota('test');
        grant.dismiss({
            forRule: {
                main: {
                    limit: 1
                }
            }
        });

        await shouldThrowOutOfQuota(() => quotaClient.requestQuota('test', undefined, undefined, {
            maxWait: 0
        }));
    });
});
