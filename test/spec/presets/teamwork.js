'use strict';

const quota = require('../../../lib');
const _ = require('lodash');

describe('Preset TeamWork', function () {
    it('should work', async function () {
        const quotaServer = new quota.Server({
            'teamwork': {
                preset: 'teamwork',
                concurrentLimit: 10
            }
        });
        const quotaClient = new quota.Client(quotaServer);

        const apiKey = 'API_KEY_DUMMY';

        function request(options) {
            return quotaClient.requestQuota('teamwork', {
                apiKey
            }, {
                requests: 1
            }, options);
        }

        let grants = [];
        for (let i = 0; i < 10; ++i) {
            grants.push(request());
        }
        grants = await Promise.all(grants);

        try {
            await request({ maxWait: 0 });
        } catch {
            grants.pop().dismiss();
        }

        await request();
    });
});