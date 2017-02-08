'use strict'

const config = require('./config.json')
const Telegraf = require('telegraf')

const bot = new Telegraf(config.telegram.botToken)

bot.command('start', ctx => {
    console.log('start', ctx.from)
    ctx.reply('Welcome!')
})

bot.hears('hi', ctx => ctx.reply('Hey there!'))

bot.startPolling()
