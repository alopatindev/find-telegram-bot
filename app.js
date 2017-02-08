'use strict'

const config = require('./config.json')
const logger = require('./logger.js')(config)

const SearchEngines = require('./search-engines.js')
const Telegraf = require('telegraf')

const WELCOME_MESSAGE = 'Hi! Please type your search query!'

const searchEngines = new SearchEngines(logger)
const bot = new Telegraf(config.telegram.botToken)

bot.command('start', ctx => {
    ctx.reply(WELCOME_MESSAGE)
})

bot.on('message', ctx => {
    const query = ctx.message.text.trim()
    if (query.length === 0) {
        ctx.reply(WELCOME_MESSAGE)
    } else {
        searchEngines
            .run(query)
            .then(result => {
                ctx.reply(result)
            })
            .catch(err => logger.error(err))
    }
})

bot.startPolling()
