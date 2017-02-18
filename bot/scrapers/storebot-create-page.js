/*!
 * find-telegram-bot <https://github.com/alopatindev/find-telegram-bot>
 *
 * Copyright (c) 2017 Alexander Lopatin
 * Licensed under the MIT License
 */

'use strict'

const storebotScript = require('./browser-scripts/storebot.js')

module.exports = (query, phantomUtils) => {
    const baseUrl = 'https://storebot.me'
    const url = encodeURI(`${baseUrl}/search?text=${query}`)

    const scripts = [
        `function() { this.baseUrl = "${baseUrl}" }`,
        storebotScript.toString(),
    ]

    const resultPromise = phantomUtils
        .openAndRun(url, scripts)
        .then(result => {
            phantomUtils.exit()
            return result // return the final result
        })
        .catch(e => {
            phantomUtils.exit(e)
            return []
        })

    return resultPromise
}
