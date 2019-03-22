'use strict';

const {
    assert
} = require('chai');
const quota = require('../../lib');

describe('Client', function () {
    it('should throw on undefined addServer', function () {
        const quotaServer = new quota.Server();

        const quotaClient = new quota.Client(quotaServer);
        try {
            quotaClient.addServer();
            throw new Error();
        } catch {}
    });

    it('should refresh cache of servers', async function () {
        const quotaServer = new quota.Server({
            'test': new quota.Manager({
                rules: [{
                    limit: 1,
                    throttling: 'limit-concurrency'
                }]
            })
        });

        const quotaClient = new quota.Client(quotaServer);
        await quotaClient._findServerForManager('test');

        quotaServer.addManager('test2', new quota.Manager({
            rules: [{
                limit: 1,
                throttling: 'limit-concurrency'
            }]
        }));

        await quotaClient._findServerForManager('test2');
    });

    it('should not accept empty server array', function () {
        try {
            new quota.Client([]);
            throw new Error('did not throw');
        } catch {}
    });

    it('should not accept empty server object', function () {
        try {
            new quota.Client({});
            throw new Error('did not throw');
        } catch {}
    });

    it('should accept an object for io', function () {
        let quotaClient;
        try {
            const host = 'http://localhost';
            const port = 80;
            quotaClient = new quota.Client({
                host,
                port
            });
            assert.equal(quotaClient.servers[0].api.socket.io.uri, `${host}:${port}`);
        } finally {
            quotaClient && quotaClient.dispose();
        }
    });
});