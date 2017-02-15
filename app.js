'use strict'

const config = require('./config.js')
const logger = require('./logger.js')(config)

const SearchEngines = require('./search-engines')
const Telegraf = require('telegraf')

const TEXT_WELCOME = 'Hi! Please type your search query!'
const TEXT_FOUND_BOTS = 'Found bots: '

const searchEngines = new SearchEngines(logger, config)
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
    .reply(TEXT_WELCOME)
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
            .reply(TEXT_WELCOME)
            .catch(logger.error)
    } else {
        searchEngines
            .find(query)
            .then(lines => ctx
                .reply(`${TEXT_FOUND_BOTS}${lines.length}`)
                .then(() => onNextReply(ctx, lines, 0))
                .catch(logger.error)
            )
            .catch(logger.error)
    }
})

bot.startPolling()
