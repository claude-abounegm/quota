'use strict';

const _ = require('lodash');
const Throttling = require('./throttling/Throttling');
const Queueing = require('./queueing/Queueing');

function loadPreset(presetName, options) {
    // TODO: Error handling
    return require(`./presets/${presetName}`)(options);
}

/**
 * 
 * @param {*} options 
 * @returns {() => Throttling}
 */
function loadThrottlingFactory(options) {
    try {
        const throttlingClass = require(`./throttling/${options.type}`);
        return moreAvailable => new throttlingClass({
            ...options,
            moreAvailable
        });
    } catch {
        throw new Error('Could not load class');
    }
}

/**
 * 
 * @param {*} options 
 * @returns {() => Queueing}
 */
function loadQueueingFactory(options) {
    try {
        const queueingClass = require(`./queueing/${options.type}`);
        return () => new queueingClass();
    } catch {
        throw new Error('Could not load class');
    }
}

function loadThrottlingClass(type) {
    // TODO: Error handling
    return require(`./throttling/${type}`);
}

function loadQueueingClass(options) {
    // TODO: Error handling
    return require(`./queueing/${options.type}`);
}

module.exports = {
    loadPreset,
    loadThrottlingFactory,
    loadQueueingFactory
};
