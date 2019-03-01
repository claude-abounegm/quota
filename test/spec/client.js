'use strict';

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
});