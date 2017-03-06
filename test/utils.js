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
    const text = e.hasOwnProperty('stack') ? e.stack : e
    logError.bind(logger)(text)
}

const functionStub = () => undefined

function createDbControllerMock() {
    return {}
}

function createAppObjectsMock() {
    const configMock = {
        message: {
            descriptionMaxLength: 70,
            maxLines: 3,
        },

        mongoUrl: 'mongodb://localhost:27017/test',

        text: {
            foundBots: 'Found bots: ',
            welcome: 'Welcome!',
        },
    }

    const loggerMock = {
        debug: functionStub,
        error: logger.error,
        info: functionStub,
    }

    const dbControllerMock = createDbControllerMock()

    return {
        config: configMock,
        dbController: dbControllerMock,
        logger: loggerMock,
    }
}

module.exports = {
    createAppObjectsMock,
    functionStub,
    logger,
}
