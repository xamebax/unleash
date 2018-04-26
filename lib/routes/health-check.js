'use strict';

const logger = require('../logger')('health-check.js');
const { Router } = require('express');

class HealthCheckController {
    constructor(config) {
        this.app = Router();

        this.app.get('/', (req, res) => {
            config.stores.db
                .select(1)
                .from('features')
                .then(() => res.json({ health: 'GOOD' }))
                .catch(err => {
                    logger.error(
                        'Could not select from features, error was: ',
                        err
                    );
                    res.status(500).json({ health: 'BAD' });
                });
        });
    }

    router() {
        return this.app;
    }
}

module.exports = HealthCheckController;
