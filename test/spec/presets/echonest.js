'use strict';

const quota = require('../../../lib');
const _ = require('lodash');

async function shouldThrowOutOfQuota(fn) {
    try {
        await fn();
        throw new Error('Expected OutOfQuotaError');
    } catch (e) {
        if (!(e instanceof quota.OutOfQuotaError)) {
            throw e;
        }
    }
}

describe('Preset Echonest', function () {
    it('should allow updating the limit', async function () {
        const quotaServer = new quota.Server({
            'echonest': {}
        });

        const quotaClient = new quota.Client(quotaServer);

        let grant = await quotaClient.requestQuota('echonest');
        grant.dismiss({
            forRule: {
                main: {
                    limit: 2
                }
            }
        });

        grant = await quotaClient.requestQuota('echonest');
        grant.dismiss();

        await shouldThrowOutOfQuota(() => quotaClient.requestQuota('echonest', undefined, undefined, {
            maxWait: 0
        }));
    });

    it('should grant more requests if limit is increased', async function () {
        const quotaServer = new quota.Server({
            'echonest': {}
        });

        const quotaClient = new quota.Client(quotaServer);

        let grant = await quotaClient.requestQuota('echonest');
        grant.dismiss({
            forRule: {
                main: {
                    limit: 2
                }
            }
        });

        grant = await quotaClient.requestQuota('echonest');
        grant.dismiss({
            forRule: {
                main: {
                    limit: 3
                }
            }
        });

        grant = await quotaClient.requestQuota('echonest');
        grant.dismiss();
    });
});
