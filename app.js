'use strict'

const config = require('./config.js')
const logger = require('./logger.js')(config)

const SearchEngines = require('./search-engines')
const Telegraf = require('telegraf')

const TEXT_WELCOME = 'Hi! Please type your search query!'
const TEXT_FOUND_BOTS = 'Found bots: '

const MAX_MESSAGE_LINES = 25

const searchEngines = new SearchEngines(logger, config)
const bot = new Telegraf(config.telegramBotToken)

bot.command('start', ctx => {
    ctx.reply(TEXT_WELCOME).catch(logger.error)
})

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
                .then(() => {
                    function onNextReply(index) {
                        if (index < lines.length) {
                            const message = lines
                                .slice(index, index + MAX_MESSAGE_LINES)
                                .join('\n')
                            ctx
                                .reply(message)
                                .then(() => onNextReply(index + MAX_MESSAGE_LINES))
                                .catch(logger.error)
                        }
                    }
                    onNextReply(0)
                })
                .catch(logger.error)
            )
            .catch(logger.error)
    }
})

bot.startPolling()
