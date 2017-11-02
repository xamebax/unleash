'use strict';

const joi = require('joi');
const customJoi = joi.extend(j => ({
    base: j.string(),
    name: 'string',
    rules: [
        {
            name: 'urlFriendly',
            validate(params, value, state, options) {
                if (encodeURIComponent(value) !== value) {
                    // Generate an error, state and options need to be passed
                    return this.createError(
                        'string.urlFriendly',
                        { v: value },
                        state,
                        options
                    );
                }
                return value; // Everything is OK
            },
        },
    ],
}));

const strategiesSchema = customJoi.object().keys({
    name: customJoi
        .string()
        .urlFriendly()
        .required(),
    parameters: joi.object(),
});

const featureSchema = customJoi.object().keys({
    name: customJoi
        .string()
        .urlFriendly()
        .required(),
    description: customJoi.string(),
    enabled: customJoi.boolean(),
    strategies: strategiesSchema,
});

module.exports = featureSchema;
