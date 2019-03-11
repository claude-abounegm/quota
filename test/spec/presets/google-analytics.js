'use strict';

const quota = require('../../../lib');
const _ = require('lodash');

describe('Preset Google Analytics', function () {
    it('should allow 1 query per second', async function () {
        const quotaServer = new quota.Server();
        quotaServer.addManager('ga', {
            preset: 'google-analytics'
        });

        const quotaClient = new quota.Client(quotaServer);
        await quotaClient.requestQuota('ga-core', {
            viewId: 123
        }, {
            requests: 1
        }, {
            maxWait: 0
        });

        try {
            await quotaClient.requestQuota('ga-core', {
                viewId: 123
            }, {
                requests: 1
            }, {
                maxWait: 0
            });

            throw new Error('Expected OutOfQuotaError');
        } catch (e) {
            if (!(e instanceof quota.OutOfQuotaError)) {
                throw e;
            }
        }
    });

    it('should report error', async function () {
        const quotaServer = new quota.Server({
            'ga': {
                preset: 'google-analytics'
            }
        });

        const quotaClient = new quota.Client(quotaServer);

        await quotaClient.requestQuota('ga-core', {
            viewId: 1234
        }, {
            requests: 1
        });

        const e = new Error('dailyLimitExceeded');
        e.code = 403;
        e.errors = [{
            reason: 'dailyLimitExceeded'
        }];
        quotaClient.reportError('ga-core', e);

        try {
            await quotaClient.requestQuota('ga-core', {
                viewId: 1234
            }, {
                requests: 1
            }, {
                maxWait: 50
            });
            throw new Error('should throw');
        } catch {}
    });

    it('should should report error on grant.dismiss', async function () {
        const quotaServer = new quota.Server({
            'ga': {
                preset: 'google-analytics'
            }
        });

        const quotaClient = new quota.Client(quotaServer);

        const grant = await quotaClient.requestQuota('ga-core', {
            viewId: 1234
        }, {
            requests: 1
        });

        const e = new Error('dailyLimitExceeded');
        e.code = 403;
        e.errors = [{
            reason: 'dailyLimitExceeded'
        }];

        grant.dismiss({
            error: e
        });

        try {
            await quotaClient.requestQuota('ga-core', {
                viewId: 1234
            }, {
                requests: 1
            }, {
                maxWait: 50
            });
            throw new Error('should throw');
        } catch {}
    });
});
