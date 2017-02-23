/*!
 * find-telegram-bot <https://github.com/alopatindev/find-telegram-bot>
 *
 * Copyright (c) 2017 Alexander Lopatin
 * Licensed under the MIT License
 */

'use strict'

const Telegraf = require('telegraf')

const ScraperFacade = require('./scrapers/scraper-facade.js')

function createBot(appObjects) {
    const {
        config,
        logger,
    } = appObjects

    const scraperFacade = new ScraperFacade(appObjects)
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
        } else {
            logger.debug(`finished replying to ${ctx.from.id}`)
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
            scraperFacade
                .find(query)
                .then(lines => ctx
                    .reply(`${config.text.foundBots}${lines.length}`)
                    .then(() => onNextReply(ctx, lines, 0))
                    .catch(logger.error)
                )
                .then(() => logger.debug(`replying to ${ctx.from.id} with results`))
                .catch(logger.error)
        }
    })

    return bot
}

module.exports = createBot
