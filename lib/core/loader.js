'use strict';

const _ = require('lodash');
const Queueing = require('../common/Queueing');
const Throttling = require('../common/Throttling');
const Backoff = require('../common/Backoff');

function loadPreset(presetName, options) {
    // TODO: Error handling
    return require(`./presets/${presetName}`)(options);
}

/**
 *
 * @param {*} options
 * @returns {Backoff}
 */
function loadBackoff(options) {
    try {
        const $class = require(`./backoff/${options.type}`);
        return new $class(options);
    } catch (_e) {
        throw new Error('Could not load class');
    }
}

function loadFactory(name, options) {
    try {
        const $class = require(`./${name}/${options.type}`);
        return scopeBundle =>
            new $class({
                scopeBundle,
                ...options
            });
    } catch (_e) {
        throw new Error('Could not load class');
    }
}

/**
 *
 * @param {*} options
 * @returns {() => Throttling}
 */
function loadThrottlingFactory(options) {
    return loadFactory('throttling', options);
}

/**
 *
 * @param {*} options
 * @returns {() => Queueing}
 */
function loadQueueingFactory(options) {
    return loadFactory('queueing', options);
}

module.exports = {
    loadPreset,
    loadBackoff,
    loadThrottlingFactory,
    loadQueueingFactory
};
