'use strict';

const quota = require('../../../lib');
const _ = require('lodash');

describe('Throttling Unlimited', function () {
    it('2 requests', async function () {
        const quotaManager = new quota.Manager();
        quotaManager.addRule({
            throttling: 'unlimited'
        });

        const quotaServer = new quota.Server();
        quotaServer.addManager('test', quotaManager);

        const quotaClient = new quota.Client(quotaServer);

        await quotaClient.requestQuota('test');
        await quotaClient.requestQuota('test');
    });
});
