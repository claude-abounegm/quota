'use strict';

const _ = require('lodash');

const Manager = require('../Manager');

/**
 * Quota Preset for TeamWork
 *
 * Quota rules based on: https://developer.teamwork.com/projects/api-responses/rate-limiting
 *
 * @returns {Manager}
 */
module.exports = function(options) {
    options = _.assign(
        {
            concurrentLimit: 10
        },
        options
    );

    if (
        options.concurrentLimit !== false &&
        !_.isNumber(options.concurrentLimit) &&
        options.concurrentLimit <= 0
    ) {
        throw new Error(
            'options.concurrentLimit needs to be false or a number greater than 0'
        );
    }

    const manager = new Manager({
        rules: [
            {
                limit: 150,
                window: 60 * 1000, // 1 minute
                throttling: 'window-sliding',
                queueing: 'fifo',
                resource: 'requests',
                scope: 'apiKey'
            }
        ]
    });

    // undocumented but teamwork limits concurrency
    if (options.concurrentLimit) {
        manager.addRule({
            limit: options.concurrentLimit,
            throttling: 'limit-concurrency',
            queueing: 'fifo',
            resource: 'requests',
            scope: 'apiKey'
        });
    }

    return manager;
};
