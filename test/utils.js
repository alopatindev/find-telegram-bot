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

function createConfigMock() {
    return {
        message: {
            descriptionMaxLength: 70,
            maxLines: 3,
        },

        text: {
            foundBots: 'Found bots: ',
            welcome: 'Welcome!',
        },
    }
}

function createLoggerMock() {
    return {
        debug: functionStub,
        error: logger.error,
        info: functionStub,
    }
}

function createAppObjectsMock() {
    const configMock = createConfigMock()
    const loggerMock = createLoggerMock()

    return {
        config: configMock,
        logger: loggerMock,
    }
}

module.exports = {
    createAppObjectsMock,
    createConfigMock,
    createLoggerMock,
    functionStub,
    logger,
}
