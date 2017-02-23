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
    return {
        storebot: new StorebotScraper(appObjects),
        tgram: new TgramScraper(appObjects),
    }
}

module.exports = createScrapers
