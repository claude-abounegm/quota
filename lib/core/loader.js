'use strict';

const _ = require('lodash');
const Throttling = require('./throttling/Throttling');
const Queueing = require('./queueing/Queueing');

function loadPreset(presetName, options) {
    // TODO: Error handling
    return require(`./presets/${presetName}`)(options);
}

function loadFactory(name, options) {
    try {
        const $class = require(`./${name}/${options.type}`);
        return scopeBundle => new $class({
            scopeBundle,
            ...options
        });
    } catch {
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
    loadThrottlingFactory,
    loadQueueingFactory
};