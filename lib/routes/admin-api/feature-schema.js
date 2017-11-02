'use strict';

const joi = require('joi');

const { urlFriendlyNameSchema } = require('./validate-util');

const strategySchema = joi.object().keys({
    name: urlFriendlyNameSchema.required(),
    parameters: joi.object(),
});

const featureSchema = joi.object().keys({
    name: urlFriendlyNameSchema.required(),
    description: joi.string(),
    enabled: joi.boolean(),
    strategies: joi
        .array()
        .items(strategySchema)
        .min(1)
        .required(),
});

module.exports = featureSchema;
