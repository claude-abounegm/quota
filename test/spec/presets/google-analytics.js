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

    it('should work', async function () {
        this.timeout(10 * 1000);

        // const io = require('socket.io')(3030);
        const quotaServer = new quota.Server({
            'ga': {
                preset: 'google-analytics',
                queriesPerSecond: 3
            }
        });
        const quotaClient = new quota.Client(quotaServer);
        // const quotaClient = new quota.Client('http://localhost:3030');

        try {
            const start = 1;
            const end = 13;
            let obj = {};
            await Promise.all(_.range(start, end + 1).map(async i => {
                return new Promise(async (resolve, reject) => {
                    console.log('before', i);
                    try {
                        const grant = await quotaClient.requestQuota('ga-general', {
                            viewId: 1234,
                            i
                        }, {
                            requests: 1
                        });
                        obj[i] = true;

                        setTimeout(() => {
                            console.log('after', i);
                            resolve(grant.dismiss());
                        }, i % 10);
                    } catch (e) {
                        reject(e);
                    }
                });
            }));

            for (const i of _.range(start, end + 1)) {
                if (!obj[i]) {
                    throw new Error('should cover all');
                }
            }
        } finally {
            // quotaClient.dispose();
            // io.close();
        }
    });
});
