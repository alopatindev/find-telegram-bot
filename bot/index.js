/*!
 * find-telegram-bot <https://github.com/alopatindev/find-telegram-bot>
 *
 * Copyright (c) 2017 Alexander Lopatin
 * Licensed under the MIT License
 */

'use strict'

const chars = require('./chars.json')

function sortAndFormatResults(results) {
    const lines = Array
        .from(results)
        .sort()
        .map(([name, description]) => `@${name} ${chars.em_dash} ${description}`)

    return lines
}

class Bot {
    constructor(telegraf, scraperFacade, appObjects) {
        this._telegraf = telegraf
        this._scraperFacade = scraperFacade
        this._config = appObjects.config
        this._logger = appObjects.logger

        telegraf.command('start', ctx => this._onStart(ctx))
        telegraf.on('message', ctx => this._onMessage(ctx))
    }

    run() {
        this._telegraf.startPolling()
    }

    _onStart(ctx) {
        ctx
            .reply(this._config.text.welcome)
            .catch(this._logger.error)
    }

    _onMessage(ctx) {
        const query = ctx
            .message
            .text
            .trim()
            .toLowerCase()

        this._logger.info(`query="${query}" from "${ctx.from.username}" (${ctx.from.id})`)

        if (query.length === 0) {
            ctx
                .reply(this._config.text.welcome)
                .catch(this._logger.error)
        } else {
            this._scraperFacade
                .find(query)
                .then(results => sortAndFormatResults(results))
                .then(lines => this._onResultsReady(ctx, lines))
                .then(() => this._logger.debug(`replying to ${ctx.from.id} with results`))
                .catch(this._logger.error)
        }
    }

    _onResultsReady(ctx, lines) {
        ctx
            .reply(`${this._config.text.foundBots}${lines.length}`)
            .then(() => this._onNextReply(ctx, lines, 0))
            .catch(this._logger.error)
    }

    _onNextReply(ctx, lines, index) {
        if (index < lines.length) {
            const nextIndex = index + this._config.message.maxLines

            const message = lines
                .slice(index, nextIndex)
                .join('\n')

            ctx
                .reply(message)
                .then(() => this._onNextReply(ctx, lines, nextIndex))
                .catch(this._logger.error)
        } else {
            this._logger.debug(`finished replying to ${ctx.from.id}`)
        }
    }
}

module.exports = Bot
