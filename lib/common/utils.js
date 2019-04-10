'use strict';

const _ = require('lodash');
const errors = require('./errors');

function unimplemented() {
    throw new Error('unimplemented');
}

/**
 * 
 * @param {Error} e 
 */
function errorToIo(e) {
    const errorObj = {
        type: 'Error',
        message: e.message,
        fields: {
            ...e, // this will serialize e to only visible fields
            origin: e.stack
        }
    };

    const {
        name,
        managerName
    } = e;

    if (name && managerName) {
        Object.assign(errorObj, {
            type: name,
            opts: [managerName]
        });
    }

    return errorObj;
}

function ioToError(e) {
    const {
        type,
        message,
        opts,
        fields
    } = e;

    let error;
    if (type !== 'Error' && errors[type]) {
        error = new errors[type](...opts);
    } else {
        error = new Error(message);
    }

    if (fields) {
        const newError = new Error();
        newError.stack = fields.origin;
        fields.origin = newError;

        Object.assign(error, fields);
    }

    return error;
}

module.exports = {
    unimplemented,
    errorToIo,
    ioToError
};