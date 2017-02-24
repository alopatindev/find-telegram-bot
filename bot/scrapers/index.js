/*!
 * find-telegram-bot <https://github.com/alopatindev/find-telegram-bot>
 *
 * Copyright (c) 2017 Alexander Lopatin
 * Licensed under the MIT License
 */

'use strict'

const TgramScraper = require('./tgram-scraper.js')
const StorebotScraper = require('./storebot-scraper.js')

function createScrapers(appObjects) {
    const storebot = new StorebotScraper(appObjects)
    const tgram = new TgramScraper(appObjects)
    return { storebot, tgram }
}

module.exports = createScrapers
