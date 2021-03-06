'use strict';

const _ = require('lodash');

const Manager = require('../Manager');

/**
 * Quota Preset for Bitly
 *
 * Quota rules based on: http://dev.bitly.com/rate_limiting.html
 * Bitly API docs: http://dev.bitly.com/api.html
 *
 * In a cluster environment a local Server can be used if each node.js instance
 * is reached via a different IP address from the internet.
 *
 * @param options
 * @returns {Manager}
 */
module.exports = function(options) {
    _.defaults(options, {
        concurrentRequests: 5,
        sharedIPAddress: false
    });

    return new Manager({
        backoff: 'timeout', // If you are experiencing rate limiting errors, please wait 60 minutes to resume making API calls.
        rules: [
            {
                limit: options.concurrentRequests,
                throttling: 'limit-concurrency',
                queueing: 'fifo',
                resource: 'requests',
                scope: (() => {
                    if (options.sharedIPAddress) {
                        return 'ipAddress';
                    }
                })()
            }
        ]
    });
};
