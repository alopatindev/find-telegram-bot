/*!
 * find-telegram-bot <https://github.com/alopatindev/find-telegram-bot>
 *
 * Copyright (c) 2017 Alexander Lopatin
 * Licensed under the MIT License
 */

'use strict'

const config = require('./config.js')
const logger = require('./logger.js')(config)
const appObjects = {
    config,
    logger,
}
const bot = require('./bot')(appObjects)

function onExit(signal) {
    logger.info(`exiting due to ${signal}`)
    process.exit(0)
}

['SIGINT', 'SIGTERM'].forEach(signal => {
    logger.debug(`set ${signal} handler`)
    process.on(signal, () => onExit(signal))
})

bot.startPolling()

logger.info('started')
