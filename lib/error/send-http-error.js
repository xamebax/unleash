'use strict';

const logger = require('../logger')('/error/send-http-error');

function sendHttpError(res, error) {
    logger.warn('Error creating or updating feature', error.message);
    switch (error.name) {
        case 'NotFoundError':
            return res
                .status(404)
                .json([{ msg: error.message }])
                .end();
        case 'NameExistsError':
            return res
                .status(403)
                .json([{ msg: error.message }])
                .end();
        case 'ValidationError':
            return res
                .status(400)
                .json(error)
                .end();
        default:
            logger.error('Server failed executing request', error);
            return res.status(500).end();
    }
}

module.exports = sendHttpError;
