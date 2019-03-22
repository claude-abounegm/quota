'use strict';

const quota = require('../../lib');
const IoApi = require('../../lib/client/IoApi');

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
    const data = {};
    beforeEach(function () {
        const io = require('socket.io')(3030);
        const quotaServer = new quota.Server();
        quotaServer.attachIo(io);

        const ioApi = new IoApi('http://localhost:3030');
        const quotaClient = new quota.Client(ioApi);

        Object.assign(data, {
            io,
            ioApi,
            quotaServer,
            quotaClient
        });
    });

    afterEach(function () {
        data['io'].close();
        data['quotaClient'].dispose();
    });

    it('should throw when adding manager', async function () {
        const {
            ioApi,
            quotaServer
        } = data;

        try {
            await ioApi.addManager('google-analytics');
            throw new Error('expected Error');
        } catch (e) {}
    });

    it('should connect to server and wait 50ms', async function () {
        const {
            quotaServer,
            quotaClient
        } = data;

        const WAIT_TIME = 50;

        quotaServer.addManager('test', new quota.Manager({
            rules: [{
                limit: 1,
                window: WAIT_TIME,
                throttling: 'window-sliding',
                queueing: 'fifo'
            }]
        }));

        const start = Date.now();

        for (let i = 0; i < 2; ++i) {
            const grant = await quotaClient.requestQuota('test', {
                viewId: 1234
            }, {
                requests: 1
            });

            const diff = Date.now() - start;
            if (i === 1 && diff < WAIT_TIME) {
                throw new Error('should wait at least one second');
            }
            grant.dismiss();
        }
    });

    it('should throw an OutOfQuotaError', async function () {
        const {
            quotaServer,
            quotaClient
        } = data;

        quotaServer.addManager('ga', {
            preset: 'google-analytics',
            queriesPerSecond: 1
        });

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

    it('should throw a NoManagerError', async function () {
        const {
            quotaServer,
            quotaClient
        } = data;

        quotaServer.addManager('test', new quota.Manager({
            rules: [{
                limit: 1,
                throttling: 'limit-absolute'
            }]
        }));

        await shouldThrowNoManager(() => quotaClient.requestQuota('unknown'));
    });

    it('should throw a NoManagerError', async function () {
        const {
            io,
            ioApi
        } = data;

        const {
            errorToIo
        } = require('../../lib/common/utils');

        const errorMessage = 'quota.testError error';
        io.on('connection', socket => {
            socket.on('quota.testError', cb => {
                const error = new Error(errorMessage);
                error.field1 = "field1";
                cb(errorToIo(error));
            });
        });

        try {
            await ioApi._request('quota.testError', () => {});
        } catch (e) {
            if (e.field1 !== 'field1') {
                throw new Error("e.field1 !== 'field1'");
            }

            if (e.message !== errorMessage) {
                throw new Error("e.message !== errorMessage");
            }
        }
    });
});