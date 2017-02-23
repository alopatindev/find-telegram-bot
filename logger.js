/*!
 * find-telegram-bot <https://github.com/alopatindev/find-telegram-bot>
 *
 * Copyright (c) 2017 Alexander Lopatin
 * Licensed under the MIT License
 */

'use strict'

const winston = require('winston')

function logger(config) {
    const logger = new winston.Logger()

    logger.add(winston.transports.File, {
        filename: config.log.file,
        level: 'info',
        maxsize: config.log.maxSize,
    })

    let level = 'info'
    if (config.live === false) {
        level = 'debug'
        logger.add(winston.transports.Console)
    }

    winston.level = level
    logger.level = level

    const logError = logger.error
    logger.error = e => {
        logError.bind(logger)(e.hasOwnProperty('stack') ? e.stack : e)
    }

    return logger
}

module.exports = logger
