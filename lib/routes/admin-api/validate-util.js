'use strict';

const joi = require('joi');
const customJoi = joi.extend(j => ({
    base: j.string(),
    name: 'string',
    language: {
        urlFriendly: 'needs to be a URL friendly string',
    },
    rules: [
        {
            name: 'urlFriendly',
            validate(params, input, state, options) {
                if (encodeURIComponent(input) !== input) {
                    // Generate an error, state and options need to be passed
                    return this.createError(
                        'string.urlFriendly',
                        { v: input },
                        state,
                        options
                    );
                }
                return input; // Everything is OK
            },
        },
    ],
}));

const urlFriendlyNameSchema = customJoi
    .string()
    .urlFriendly()
    .label('name');

function validate(schema, data) {
    return new Promise((resolve, reject) => {
        joi.validate(data, schema, (err, cleaned) => {
            if (err) {
                return reject(err);
            }
            return resolve(cleaned);
        });
    });
}

module.exports.urlFriendlyNameSchema = urlFriendlyNameSchema;
module.exports.validate = validate;
