'use strict';

const { Router } = require('express');

const eventType = require('../../event-type');
const NameExistsError = require('../../error/name-exists-error');
const extractUser = require('../../extract-user');
const schema = require('./strategy-schema');
const sendHttpError = require('../../error/send-http-error');

const { validate } = require('./validate-util');

const version = 1;

function validateEditable(strategyName) {
    return strategy => {
        if (strategy.editable === false) {
            throw new Error(
                `Cannot edit strategy ${strategyName}, editable is false`
            );
        }
        return strategy;
    };
}

exports.router = function(config) {
    const { strategyStore, eventStore } = config.stores;
    const router = Router();

    router.get('/', (req, res) => {
        strategyStore.getStrategies().then(strategies => {
            res.json({ version, strategies });
        });
    });

    router.get('/:name', (req, res) => {
        strategyStore
            .getStrategy(req.params.name)
            .then(strategy => res.json(strategy).end())
            .catch(() =>
                res.status(404).json({ error: 'Could not find strategy' })
            );
    });

    router.delete('/:name', (req, res) => {
        const strategyName = req.params.name;

        strategyStore
            .getStrategy(strategyName)
            .then(validateEditable(strategyName))
            .then(() =>
                eventStore.store({
                    type: eventType.STRATEGY_DELETED,
                    createdBy: extractUser(req),
                    data: {
                        name: strategyName,
                    },
                })
            )
            .then(() => res.status(200).end())
            .catch(error => sendHttpError(res, error));
    });

    function validateStrategyName(data) {
        return new Promise((resolve, reject) => {
            strategyStore
                .getStrategy(data.name)
                .then(() =>
                    reject(
                        new NameExistsError(
                            `A strategy named '${data.name}' already exists.`
                        )
                    )
                )
                .catch(() => resolve(data));
        });
    }

    router.post('/', (req, res) => {
        const input = req.body;
        validate(schema, input)
            .then(validateStrategyName)
            .then(newStrategy =>
                eventStore.store({
                    type: eventType.STRATEGY_CREATED,
                    createdBy: extractUser(req),
                    data: newStrategy,
                })
            )
            .then(() => res.status(201).end())
            .catch(error => sendHttpError(res, error));
    });

    router.put('/:strategyName', (req, res) => {
        const strategyName = req.params.strategyName;
        const updatedStrategy = req.body;

        updatedStrategy.name = strategyName;

        strategyStore
            .getStrategy(strategyName)
            .then(validateEditable(strategyName))
            .then(() => validate(schema, updatedStrategy))
            .then(() =>
                eventStore.store({
                    type: eventType.STRATEGY_UPDATED,
                    createdBy: extractUser(req),
                    data: updatedStrategy,
                })
            )
            .then(() => res.status(200).end())
            .catch(error => sendHttpError(res, error));
    });

    return router;
};
