'use strict';

const {
    assert
} = require('chai');

const quota = require('../../lib');
const {
    Client: QuotaClient
} = quota;

describe('Error Handlers', function () {
    const NEXT_WINDOW_MS = 50;

    function newServer() {
        return new quota.Server({
            'test': new quota.Manager({
                backoff: 'timeout',
                rules: [{
                    limit: 100,
                    throttling: {
                        type: 'window-fixed',
                        getStartOfNextWindow: () => {
                            return Date.now() + NEXT_WINDOW_MS;
                        }
                    },
                    queueing: 'fifo',
                    resource: 'requests',
                    onError: (_rule, throttling, e) => {
                        if (e.code === 403) {
                            throttling.saturate();
                        }
                    }
                }]
            })
        });
    }

    class Error403 extends Error {
        constructor() {
            super('test');
            this.name = 'Error403';
            this.code = 403;
        }
    }

    /**
     * 
     * @param {QuotaClient} quotaClient 
     */
    async function executeTest(quotaClient) {
        await quotaClient.requestQuota('test', {}, {
            requests: 1
        });

        quotaClient.reportError('test', new Error403());

        try {
            const start = Date.now();
            await quotaClient.requestQuota('test', {}, {
                requests: 1
            });
            const end = Date.now();

            if (end - start < NEXT_WINDOW_MS) {
                throw new Error('should elapse at least NEXT_WINDOW_MS');
            }
        } catch {}
    }

    it('should work in io', async function () {
        const io = require('socket.io')(3030);
        const quotaServer = newServer();
        quotaServer.attachIo(io);
        const quotaClient = new quota.Client('http://localhost:3030');

        try {
            await executeTest(quotaClient);
        } finally {
            io.close();
            quotaClient.dispose();
        }
    });

    it('should work in normal', async function () {
        const quotaServer = newServer();
        const quotaClient = new quota.Client(quotaServer);
        await executeTest(quotaClient);
    });
});