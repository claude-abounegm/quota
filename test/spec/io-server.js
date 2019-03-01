'use strict';

const quota = require('../../lib');

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

describe('io server', function () {
    it('should throw when adding manager', async function() {
        const io = require('socket.io')(3030);

        const quotaServer = new quota.Server();
        quotaServer.addManager('ga', {
            preset: 'google-analytics',
            queriesPerSecond: 1
        });
        quotaServer.attachIo(io);

        const quotaClient = new quota.Client('http://localhost:3030');
        const server = await quotaClient._findServerForManager('ga');

        try {
            await server.addManager('google-analytics');
            throw new Error('expected Error');
        } catch(e) {

        }

        quotaClient.dispose();
        io.close();
    });

    it('should connect to server and wait one second', async function () {
        const io = require('socket.io')(3030);

        const quotaServer = new quota.Server();
        quotaServer.addManager('ga', {
            preset: 'google-analytics',
            queriesPerSecond: 1
        });
        quotaServer.attachIo(io);

        const quotaClient = new quota.Client('http://localhost:3030');
        const start = Date.now();

        for (let i = 0; i < 2; ++i) {
            const grant = await quotaClient.requestQuota('ga-core', {
                viewId: 1234
            }, {
                requests: 1
            });

            const diff = Date.now() - start;
            if (i === 1 && diff < 1000) {
                throw new Error('should wait at least one second');
            }
            grant.dismiss();
        }

        quotaClient.dispose();
        io.close();
    });

    it('should throw an OutOfQuotaError', async function () {
        const io = require('socket.io')(3030);
        const quota = require('../../lib');

        const quotaServer = new quota.Server();
        quotaServer.addManager('ga', {
            preset: 'google-analytics',
            queriesPerSecond: 1
        });
        quotaServer.attachIo(io);

        const quotaClient = new quota.Client('http://localhost:3030');

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

        quotaClient.dispose();
        io.close();
    });

    it('should throw a NoManagerError', async function () {
        const io = require('socket.io')(3030);
        const quota = require('../../lib');

        const quotaServer = new quota.Server({
            'test': new quota.Manager({
                rules: [{
                    limit: 1,
                    throttling: 'limit-absolute'
                }]
            })
        });
        quotaServer.attachIo(io);

        const quotaClient = new quota.Client('http://localhost:3030');
        await shouldThrowNoManager(() => quotaClient.requestQuota('unknown'));

        quotaClient.dispose();
        io.close();
    });
});