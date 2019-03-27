'use strict';

const quota = require('../../lib');
const BaseGrant = require('../../lib/core/BaseGrant');

describe('BaseGrant', function () {
    it('should throw an error on dismiss()', function () {
        const grant = new BaseGrant();

        try {
            grant.dismiss();
            throw new Error('error expected')
        } catch {}
    });
});

describe('Grant', function () {
    it('should dimiss correctly', async function () {
        const quotaServer = new quota.Server({
            'test': new quota.Manager({
                rules: [{
                    limit: 1,
                    throttling: 'limit-concurrency'
                }]
            })
        });

        const quotaClient = new quota.Client(quotaServer);
        const grant = await quotaClient.requestQuota('test');
        grant.dismiss();
        await quotaClient.requestQuota('test');
    });

    it('should throw on wrong feedback and up limit on correct one', async function () {
        const quotaServer = new quota.Server({
            'test': new quota.Manager({
                rules: [{
                    name: 'rule1',
                    limit: 1,
                    throttling: 'limit-concurrency'
                }]
            })
        });

        const quotaClient = new quota.Client(quotaServer);
        const grant = await quotaClient.requestQuota('test');
        try {
            grant.dismiss(() => {});
            throw new Error('grant should not be dimissed');
        } catch {}

        try {
            grant.dismiss({
                forRule: {
                    'rule1': {
                        limit: 2
                    }
                }
            });
        } catch {}

        await quotaClient.requestQuota('test');
        await quotaClient.requestQuota('test');
    });
});