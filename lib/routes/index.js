'use strict';

const { Router } = require('express');
// export module version
require('pkginfo')(module, 'version');

const version = module.exports.version;

const adminApi = require('./admin-api');
const clientApi = require('./client-api');
const clientFeatures = require('./client-api/feature.js');

const HealthCheckController = require('./health-check');
const backstage = require('./backstage.js');

class IndexController {
    constructor(config) {
        this.app = Router();

        this.app.use('/health', new HealthCheckController(config).router());
        this.app.use('/internal-backstage', backstage.router(config));

        this.app.get('/api', (req, res) => {
            res.json({
                name: 'unleash-server',
                version,
                links: {
                    admin: {
                        uri: '/api/admin',
                        links: adminApi.apiDef.links,
                    },
                    client: {
                        uri: '/api/client',
                        links: clientApi.apiDef.links,
                    },
                },
            });
        });

        this.app.use('/api/admin', adminApi.router(config));
        this.app.use('/api/client', clientApi.router(config));

        // legacy support
        // $root/features
        // $root/client/register
        // $root/client/metrics
        if (config.enableLegacyRoutes) {
            this.app.use('/api/features', clientFeatures.router(config));
        }
    }

    router() {
        return this.app;
    }
}

module.exports = IndexController;
