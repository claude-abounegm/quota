'use strict';

const quota = require('../../lib');

describe('Error Handlers', function () {
    it('should work in io', async function () {
        const io = require('socket.io')(3030);
        const quotaServer = new quota.Server({
            'test': new quota.Manager({
                backoff: 'timeout',
                rules: [{
                    limit: 100,
                    throttling: {
                        type: 'window-fixed',
                        getStartOfNextWindow: () => {
                            return Date.now() + 500;
                        }
                    },
                    queueing: 'fifo',
                    resource: 'requests',
                    onError: (_rule, throttling, e) => {
                        if (e.foo === 'foo') {
                            throttling.saturate();
                        }
                    }
                }]
            })
        });
        quotaServer.attachIo(io);

        const quotaClient = new quota.Client('http://localhost:3030');

        await quotaClient.requestQuota('test', {}, {
            requests: 1
        });

        const error = new Error('test');
        error.foo = 'foo';
        quotaClient.reportError('test', error);

        try {
            await quotaClient.requestQuota('test', {}, {
                requests: 1
            }, {
                maxWait: 50
            });
            throw new Error('should throw');
        } catch {}

        io.close();
        quotaClient.dispose();
    });

    it('should work in normal', async function () {
        const quotaServer = new quota.Server({
            'test': new quota.Manager({
                backoff: 'timeout',
                rules: [{
                    limit: 100,
                    throttling: {
                        type: 'window-fixed',
                        getStartOfNextWindow: () => {
                            return Date.now() + 500;
                        }
                    },
                    queueing: 'fifo',
                    resource: 'requests',
                    onError: (_rule, throttling, e) => {
                        if (e.foo === 'foo') {
                            throttling.saturate();
                        }
                    }
                }]
            })
        });

        const quotaClient = new quota.Client(quotaServer);

        await quotaClient.requestQuota('test', {}, {
            requests: 1
        });

        const error = new Error('test');
        error.foo = 'foo';
        quotaClient.reportError('test', error);

        try {
            await quotaClient.requestQuota('test', {}, {
                requests: 1
            }, {
                maxWait: 200
            });
            throw new Error('should throw');
        } catch {}
    });
});