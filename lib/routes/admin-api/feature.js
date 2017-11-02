'use strict';

const { Router } = require('express');

const {
    FEATURE_CREATED,
    FEATURE_UPDATED,
    FEATURE_ARCHIVED,
} = require('../../event-type');
const NameExistsError = require('../../error/name-exists-error');
const sendHttpError = require('../../error/send-http-error');
const extractUser = require('../../extract-user');

const schema = require('./feature-schema');
const { urlFriendlyNameSchema, validate } = require('./validate-util');

const version = 1;

module.exports.router = function(config) {
    const { featureToggleStore, eventStore } = config.stores;
    const router = Router();

    router.get('/', (req, res) => {
        featureToggleStore
            .getFeatures()
            .then(features => res.json({ version, features }));
    });

    router.get('/:featureName', (req, res) => {
        featureToggleStore
            .getFeature(req.params.featureName)
            .then(feature => res.json(feature).end())
            .catch(() =>
                res.status(404).json({ error: 'Could not find feature toggle' })
            );
    });

    function validateUniqueName(toggle) {
        return new Promise((resolve, reject) => {
            featureToggleStore
                .getFeature(toggle.name)
                .then(() =>
                    reject(
                        new NameExistsError(
                            'A feature with this name already exists. Try re-activating it from the archive.'
                        )
                    )
                )
                .catch(() => resolve(toggle));
        });
    }

    router.post('/validate', (req, res) => {
        const name = req.body.name;

        validate(urlFriendlyNameSchema, name)
            .then(() => validateUniqueName({ name: req.body.name }))
            .then(() => res.status(200).end())
            .catch(error => sendHttpError(res, error));
    });

    router.post('/', (req, res) => {
        const input = req.body;
        const userName = extractUser(req);

        validate(schema, input)
            .then(validateUniqueName)
            .then(featureToggle =>
                eventStore.store({
                    type: FEATURE_CREATED,
                    createdBy: userName,
                    data: featureToggle,
                })
            )
            .then(() => res.status(201).end())
            .catch(error => sendHttpError(res, error));
    });

    router.put('/:featureName', (req, res) => {
        const featureName = req.params.featureName;
        const userName = extractUser(req);
        const updatedFeature = req.body;

        updatedFeature.name = featureName;

        featureToggleStore
            .getFeature(featureName)
            .then(() => validate(schema, updatedFeature))
            .then(() =>
                eventStore.store({
                    type: FEATURE_UPDATED,
                    createdBy: userName,
                    data: updatedFeature,
                })
            )
            .then(() => res.status(200).end())
            .catch(error => sendHttpError(res, error));
    });

    router.post('/:featureName/toggle', (req, res) => {
        const featureName = req.params.featureName;
        const userName = extractUser(req);

        featureToggleStore
            .getFeature(featureName)
            .then(feature => {
                feature.enabled = !feature.enabled;
                return eventStore.store({
                    type: FEATURE_UPDATED,
                    createdBy: userName,
                    data: feature,
                });
            })
            .then(() => res.status(200).end())
            .catch(error => sendHttpError(res, error));
    });

    router.delete('/:featureName', (req, res) => {
        const featureName = req.params.featureName;
        const userName = extractUser(req);

        featureToggleStore
            .getFeature(featureName)
            .then(() =>
                eventStore.store({
                    type: FEATURE_ARCHIVED,
                    createdBy: userName,
                    data: {
                        name: featureName,
                    },
                })
            )
            .then(() => res.status(200).end())
            .catch(error => sendHttpError(res, error));
    });

    return router;
};
