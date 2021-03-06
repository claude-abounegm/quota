'use strict';

const _ = require('lodash');
const moment = require('moment-timezone');
const Manager = require('../Manager');

function isGaError(e, code, reasons) {
    if (reasons) {
        if (_.isString(reasons)) {
            reasons = [reasons];
        } else if (!Array.isArray(reasons)) {
            throw new Error('reasons needs to be an array or string');
        }
    }

    if (e.code === code) {
        if (!reasons) {
            // no reasons supplied, we check
            // for the code only
            return true;
        }

        if (!Array.isArray(e.errors)) {
            // we can't check for reasons if we
            // don't have any...
            return false;
        }

        return e.errors.some(entry => {
            for (const reason of reasons) {
                if (entry.reason === reason) {
                    return true;
                }
            }
        });
    }

    return false;
}

/**
 * Quota Preset for Google Analytics' Reporting and Configuration APIs
 *
 * Quota rules based on: https://developers.google.com/analytics/devguides/reporting/core/v3/limits-quotas
 * Reporting APIs docs: https://developers.google.com/analytics/devguides/reporting/
 * Configuration APIs docs: https://developers.google.com/analytics/devguides/config/
 *
 * In a cluster environment a local Server may be used if the daily project
 * limits of 50,000 read requests in general and 500 write requests for the
 * Management API is unlikely reached, if each node.js instance is reached via
 * a different IP address from the internet, and if all requests made on behalf
 * a particular user are only made by a single node.js instance.
 * The Provisioning API, however, requires a centralized Server.
 *
 * @param {{
        dailyRequests: number,
        dailyWrites: number,
        queriesPerSecond: number,
        qpsPerUser: boolean,
        sharedIPAddress: boolean
 * }} [options]
 * @returns {{
        'general': Manager,
        'management': Manager,
        'provisioning': Manager,
        'core': Manager,
        'real-time': Manager,
        'mcf': Manager
    }}
 */
module.exports = function(options) {
    // Note: Daily quotas refresh at midnight PST.
    function getStartOfNextWindow() {
        return moment
            .tz('America/Los_Angeles')
            .endOf('day')
            .add('1', 'minute')
            .valueOf();
        // return moment.utc().startOf('day').add(1, 'day').add(8, 'hours').valueOf();
    }

    _.defaults(options, {
        dailyRequests: 50000,
        dailyWrites: 500,
        queriesPerSecond: 1,
        qpsPerUser: false,
        sharedIPAddress: false
    });

    // https://developers.google.com/analytics/devguides/reporting/core/v3/errors
    const backoff = {
        type: 'exponential',
        shouldBackoff: e => {
            return (
                isGaError(e, 403, [
                    'userRateLimitExceeded',
                    'rateLimitExceeded',
                    'quotaExceeded'
                ]) || isGaError(e, 500, ['internalServerError', 'backendError'])
            );
        }
    };

    // General Quota Limits (All APIs)
    const generalManager = new Manager({
        backoff,
        rules: [
            // 50,000 requests per project per day – can be increased
            {
                limit: options.dailyRequests,
                throttling: {
                    type: 'window-fixed',
                    getStartOfNextWindow
                },
                resource: 'requests',
                onError: (throttling, e) => {
                    if (isGaError(e, 403, 'dailyLimitExceeded')) {
                        console.log(
                            'quota (google-anayltics): dailyLimitExceeded'
                        );
                        throttling.saturate();
                    }
                }
            },
            // 10 queries per second (QPS) per IP
            // By default, it is set to 1 query per second (QPS) and can be adjusted to a maximum value of 10.
            // Adjustment can be done here: https://console.developers.google.com/project?authuser=2
            {
                limit: options.queriesPerSecond,
                window: 1000,
                throttling: 'window-sliding',
                queueing: 'fifo',
                resource: 'requests',
                scope: (() => {
                    if (options.qpsPerUser) {
                        return 'userId';
                    }

                    if (options.sharedIPAddress) {
                        return 'ipAddress';
                    }
                })()
            }
        ]
    });

    // Management Api
    const managementManager = new Manager(
        {
            backoff,
            rules: [
                // Management API - Write Requests
                // 500 write requests per project per day – can be increased
                {
                    limit: options.dailyWrites,
                    throttling: {
                        type: 'window-fixed',
                        getStartOfNextWindow
                    },
                    resource: 'writeRequests'
                },
                // Management API - Data Import
                // 10 GB per property
                {
                    limit: 10 * 1024 * 1024 * 1024,
                    throttling: 'limit-absolute',
                    scope: ['userId', 'propertyId'],
                    resource: 'bytes'
                },
                // 10 GB per data set
                {
                    limit: 10 * 1024 * 1024 * 1024,
                    throttling: 'limit-absolute',
                    scope: ['userId', 'datasetId'],
                    resource: 'bytes'
                },
                // 50 Data Sets per property
                {
                    limit: 50,
                    throttling: 'limit-absolute',
                    scope: ['userId', 'propertyId'],
                    resource: 'datasets'
                },
                // 50 upload operations per property per day
                {
                    limit: 50,
                    throttling: {
                        type: 'window-fixed',
                        getStartOfNextWindow
                    },
                    scope: ['userId', 'propertyId'],
                    resource: 'writeRequests'
                },
                // 100 MB per date (ga:date) per data set
                {
                    limit: 100 * 1024 * 1024,
                    throttling: 'limit-absolute',
                    scope: ['userId', 'datasetId', 'date'],
                    resource: 'bytes'
                },
                // Management API - Unsampled Reports
                // 100 unsampled reports per day per property
                {
                    limit: 100,
                    throttling: {
                        type: 'window-fixed',
                        getStartOfNextWindow
                    },
                    scope: ['userId', 'propertyId'],
                    resource: 'unsampledReports'
                }
            ]
        },
        generalManager
    );

    // Provisioning API - Write Requests
    const provisioningManager = new Manager(
        {
            backoff,
            rules: [
                // 50 requests per project per day
                {
                    limit: 50,
                    throttling: {
                        type: 'window-fixed',
                        getStartOfNextWindow
                    },
                    resource: 'writeRequests'
                }
            ]
        },
        generalManager
    );

    // Core Reporting API and Real Time Reporting API
    const reportingManager = new Manager(
        {
            backoff,
            rules: [
                // 10,000 requests per view (profile) per day
                {
                    limit: 10000,
                    throttling: {
                        type: 'window-fixed',
                        getStartOfNextWindow
                    },
                    queueing: 'fifo',
                    scope: 'viewId',
                    resource: 'requests'
                },
                // 10 concurrent requests per view (profile)
                {
                    limit: 10,
                    throttling: 'limit-concurrency',
                    queueing: 'fifo',
                    scope: 'viewId',
                    resource: 'requests'
                }
            ]
        },
        generalManager
    );

    // Multi-channel Funnel Reporting API
    const mcfManager = new Manager(
        {
            backoff,
            rules: [
                // 10 concurrent requests per view (profile)
                {
                    limit: 10,
                    throttling: 'limit-concurrency',
                    queueing: 'fifo',
                    scope: 'viewId',
                    resource: 'requests'
                }
            ]
        },
        generalManager
    );

    return {
        general: generalManager,
        management: managementManager,
        provisioning: provisioningManager,
        core: reportingManager,
        'real-time': reportingManager,
        mcf: mcfManager
    };
};
