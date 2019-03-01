'use strict';

const quota = require('../../../lib');
const _ = require('lodash');

describe('Preset Facebook', function () {
    it('should grant unlimited quota for the Graph API', function () {
        const quotaServer = new quota.Server({
            'facebook': {}
        });

        const quotaClient = new quota.Client(quotaServer);

        return Promise.all([
            quotaClient.requestQuota('facebook'),
            quotaClient.requestQuota('facebook'),
            quotaClient.requestQuota('facebook'),
            quotaClient.requestQuota('facebook'),
            quotaClient.requestQuota('facebook'),
            quotaClient.requestQuota('facebook'),
            quotaClient.requestQuota('facebook'),
            quotaClient.requestQuota('facebook'),
            quotaClient.requestQuota('facebook'),
            quotaClient.requestQuota('facebook'),
            quotaClient.requestQuota('facebook'),
            quotaClient.requestQuota('facebook')
        ]);
    });

    it('should grant unlimited quota for requests to the marketing API', function () {
        const quotaServer = new quota.Server({
            'facebook': {
                api: 'marketing'
            }
        });

        const quotaClient = new quota.Client(quotaServer);

        return Promise.all([
            quotaClient.requestQuota('facebook', {}, {
                requests: 999
            }),
            quotaClient.requestQuota('facebook', {}, {
                requests: 999
            }),
            quotaClient.requestQuota('facebook', {}, {
                requests: 999
            }),
            quotaClient.requestQuota('facebook', {}, {
                requests: 999
            }),
            quotaClient.requestQuota('facebook', {}, {
                requests: 999
            }),
            quotaClient.requestQuota('facebook', {}, {
                requests: 999
            }),
            quotaClient.requestQuota('facebook', {}, {
                requests: 999
            }),
            quotaClient.requestQuota('facebook', {}, {
                requests: 999
            }),
            quotaClient.requestQuota('facebook', {}, {
                requests: 999
            }),
            quotaClient.requestQuota('facebook', {}, {
                requests: 999
            }),
            quotaClient.requestQuota('facebook', {}, {
                requests: 999
            }),
            quotaClient.requestQuota('facebook', {}, {
                requests: 999
            })
        ]);
    });

    it('should grant 4 budgetChange requests to the Marketing API', function () {
        const quotaServer = new quota.Server({
            'facebook': {
                api: 'marketing'
            }
        });

        const quotaClient = new quota.Client(quotaServer);

        return Promise.all([
            quotaClient.requestQuota('facebook', {
                adSetId: 1
            }, {
                budgetChange: 1
            }),
            quotaClient.requestQuota('facebook', {
                adSetId: 1
            }, {
                budgetChange: 1
            }),
            quotaClient.requestQuota('facebook', {
                adSetId: 1
            }, {
                budgetChange: 1
            }),
            quotaClient.requestQuota('facebook', {
                adSetId: 1
            }, {
                budgetChange: 1
            }),
            quotaClient.requestQuota('facebook', {
                adSetId: 1
            }, {
                budgetChange: 1
            }, {
                maxWait: 0
            })
            .then(function () {
                throw new Error('Expected OutOfQuotaError');
            })
            .catch(function (err) {
                if (!(err instanceof quota.OutOfQuotaError)) {
                    throw err;
                }
            })
        ]);
    });
});
