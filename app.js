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

const Scrapers = require('./scrapers')
const Telegraf = require('telegraf')

function onExit(signal) {
    logger.info(`Exiting due to ${signal}`)
    process.exit(0)
}

for (const signal of ['SIGINT', 'SIGTERM']) {
    logger.debug(`Set ${signal} handler`)
    process.on(signal, () => onExit(signal))
}

const scrapers = new Scrapers(appObjects)
const bot = new Telegraf(config.telegramBotToken)

function onNextReply(ctx, lines, index) {
    if (index < lines.length) {
        const nextIndex = index + config.message.maxLines

        const message = lines
            .slice(index, nextIndex)
            .join('\n')

        ctx
            .reply(message)
            .then(() => onNextReply(ctx, lines, nextIndex))
            .catch(logger.error)
    }
}

bot.command('start', ctx => ctx
    .reply(config.text.welcome)
    .catch(logger.error)
)

bot.on('message', ctx => {
    const query = ctx
        .message
        .text
        .trim()
        .toLowerCase()

    logger.info(`query="${query}" from "${ctx.from.username}" (${ctx.from.id})`)

    if (query.length === 0) {
        ctx
            .reply(config.text.welcome)
            .catch(logger.error)
    } else {
        scrapers
            .find(query)
            .then(lines => ctx
                .reply(`${config.text.foundBots}${lines.length}`)
                .then(() => onNextReply(ctx, lines, 0))
                .catch(logger.error)
            )
            .catch(logger.error)
    }
})

bot.startPolling()
