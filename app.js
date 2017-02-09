'use strict'

const config = require('./config.js')
const logger = require('./logger.js')(config)

const SearchEngines = require('./search-engines.js')
const Telegraf = require('telegraf')

const TEXT_WELCOME = 'Hi! Please type your search query!'

const searchEngines = new SearchEngines(logger)
const bot = new Telegraf(config.telegramBotToken)

bot.command('start', ctx => {
    ctx.reply(TEXT_WELCOME).catch(logger.error)
})

bot.on('message', ctx => {
    const query = ctx.message.text.trim()

    if (query.length === 0) {
        ctx.reply(TEXT_WELCOME).catch(logger.error)
    } else {
        searchEngines
            .find(query)
            .then(result => {
                logger.debug(result)
                return ctx.reply(result)
            })
            .catch(logger.error)
    }
})

bot.startPolling()
