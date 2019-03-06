'use strict';

const quota = require('../../../lib');
const _ = require('lodash');

describe('Preset Facebook', function () {
    it('should grant unlimited quota for the Graph API', function () {
        const quotaServer = new quota.Server({
            'fb': {
                preset: 'facebook'
            }
        });

        const quotaClient = new quota.Client(quotaServer);

        return Promise.all([
            quotaClient.requestQuota('fb-graph'),
            quotaClient.requestQuota('fb-graph'),
            quotaClient.requestQuota('fb-graph'),
            quotaClient.requestQuota('fb-graph'),
            quotaClient.requestQuota('fb-graph'),
            quotaClient.requestQuota('fb-graph'),
            quotaClient.requestQuota('fb-graph'),
            quotaClient.requestQuota('fb-graph'),
            quotaClient.requestQuota('fb-graph'),
            quotaClient.requestQuota('fb-graph'),
            quotaClient.requestQuota('fb-graph'),
            quotaClient.requestQuota('fb-graph')
        ]);
    });

    it('should grant unlimited quota for requests to the marketing API', function () {
        const quotaServer = new quota.Server({
            'fb': {
                preset: 'facebook'
            }
        });

        const quotaClient = new quota.Client(quotaServer);

        return Promise.all([
            quotaClient.requestQuota('fb-marketing', {}, {
                requests: 999
            }),
            quotaClient.requestQuota('fb-marketing', {}, {
                requests: 999
            }),
            quotaClient.requestQuota('fb-marketing', {}, {
                requests: 999
            }),
            quotaClient.requestQuota('fb-marketing', {}, {
                requests: 999
            }),
            quotaClient.requestQuota('fb-marketing', {}, {
                requests: 999
            }),
            quotaClient.requestQuota('fb-marketing', {}, {
                requests: 999
            }),
            quotaClient.requestQuota('fb-marketing', {}, {
                requests: 999
            }),
            quotaClient.requestQuota('fb-marketing', {}, {
                requests: 999
            }),
            quotaClient.requestQuota('fb-marketing', {}, {
                requests: 999
            }),
            quotaClient.requestQuota('fb-marketing', {}, {
                requests: 999
            }),
            quotaClient.requestQuota('fb-marketing', {}, {
                requests: 999
            }),
            quotaClient.requestQuota('fb-marketing', {}, {
                requests: 999
            })
        ]);
    });

    it('should grant 4 budgetChange requests to the Marketing API', function () {
        const quotaServer = new quota.Server({
            'fb': {
                preset: 'facebook'
            }
        });

        const quotaClient = new quota.Client(quotaServer);

        return Promise.all([
            quotaClient.requestQuota('fb-marketing', {
                adSetId: 1
            }, {
                budgetChange: 1
            }),
            quotaClient.requestQuota('fb-marketing', {
                adSetId: 1
            }, {
                budgetChange: 1
            }),
            quotaClient.requestQuota('fb-marketing', {
                adSetId: 1
            }, {
                budgetChange: 1
            }),
            quotaClient.requestQuota('fb-marketing', {
                adSetId: 1
            }, {
                budgetChange: 1
            }),
            quotaClient.requestQuota('fb-marketing', {
                adSetId: 1
            }, {
                budgetChange: 1
            }, {
                maxWait: 0
            })
            .then(() => {
                throw new Error('Expected OutOfQuotaError');
            })
            .catch(err => {
                if (!(err instanceof quota.OutOfQuotaError)) {
                    throw err;
                }
            })
        ]);
    });
});
