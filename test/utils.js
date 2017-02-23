/*!
 * find-telegram-bot <https://github.com/alopatindev/find-telegram-bot>
 *
 * Copyright (c) 2017 Alexander Lopatin
 * Licensed under the MIT License
 */

'use strict'

const logger = require('mocha-logger')

const logError = logger.error
logger.error = e => {
    logError.bind(logger)(e.hasOwnProperty('stack') ? e.stack : e)
}

const functionStub = () => undefined

function createAppObjectsMock() {
    return {
        config: {
            message: {
                descriptionMaxLength: 100,
                maxLines: 3,
            },

            text: {
                foundBots: 'Found bots: ',
                welcome: 'Welcome!',
            },
        },

        logger: {
            debug: functionStub,
            error: logger.error,
            info: functionStub,
        },
    }
}

module.exports = {
    createAppObjectsMock,
    functionStub,
    logger,
}
