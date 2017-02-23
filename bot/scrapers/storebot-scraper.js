/*!
 * find-telegram-bot <https://github.com/alopatindev/find-telegram-bot>
 *
 * Copyright (c) 2017 Alexander Lopatin
 * Licensed under the MIT License
 */

'use strict'

const Scraper = require('./scraper.js')
const storebotScript = require('./browser-scripts/storebot.js')

class StorebotScraper extends Scraper {
    _onCreatePage(query, phantomController) {
        const baseUrl = 'https://storebot.me'
        const url = encodeURI(`${baseUrl}/search?text=${query}`)

        const scripts = [
            `function() { this.baseUrl = "${baseUrl}" }`,
            storebotScript.toString(),
        ]

        const resultPromise = phantomController
            .openAndRun(url, scripts)
            .then(result => {
                phantomController.exit()
                return result // return the final result
            })
            .catch(e => {
                phantomController.exit(e)
                return []
            })

        return resultPromise
    }
}

module.exports = StorebotScraper
