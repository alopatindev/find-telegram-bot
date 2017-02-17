/*!
 * find-telegram-bot <https://github.com/alopatindev/find-telegram-bot>
 *
 * Copyright (c) 2017 Alexander Lopatin
 * Licensed under the MIT License
 */

'use strict'

const tgramScript = require('./browser-scripts/tgram.js')

module.exports = (query, phantomUtils, appObjects) => {
    const {
        logger,
        config,
    } = appObjects

    const shared = {}

    const baseUrl = 'https://tgram.ru'
    const url = encodeURI(`${baseUrl}/bots`)

    phantomUtils.setOnCallback(result => {
        phantomUtils.exit()

        // return the final result
        shared.onResolveResult(result)
    })

    const scripts = [
        `function() { this.baseUrl = "${baseUrl}"; this.query = "${query}" }`,
        tgramScript,
    ]

    const resultPromise = phantomUtils
        .openAndRun(url, scripts)
        .then(() => new Promise((resolve, reject) => {
            shared.onResolveResult = resolve
            shared.onRejectResult = reject
            logger.debug(`set scraping timeout to ${config.scrapingTimeoutMs}`)
            setTimeout(() => shared.onRejectResult(new Error('Scraping Timeout')), config.scrapingTimeoutMs)
        }))
        .catch(e => {
            phantomUtils.exit(e)
            return []
        })

    return resultPromise
}
