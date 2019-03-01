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
});
