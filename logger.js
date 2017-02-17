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
        filename: 'logs/find-telegram-bot.log',
        level: 'info',
        maxsize: config.logMaxSize,
    })

    let level = 'info'
    if (config.live === false) {
        level = 'debug'
        logger.add(winston.transports.Console)
    }

    winston.level = level
    logger.level = level

    return logger
}

module.exports = logger
