/*!
 * find-telegram-bot <https://github.com/alopatindev/find-telegram-bot>
 *
 * Copyright (c) 2017 Alexander Lopatin
 * Licensed under the MIT License
 */

'use strict'

const tgramScript = require('./browser-scripts/tgram.js')

module.exports = (query, phantomObjects, appObjects) => {
    const {
        page,
        openThrowable,
        instancePromise,
    } = phantomObjects

    const {
        logger,
        config,
    } = appObjects

    const shared = {}

    const baseUrl = 'https://tgram.ru'
    const url = encodeURI(`${baseUrl}/bots`)

    page.on('onCallback', result => {
        try {
            instancePromise
                .then(instance => {
                    logger.debug('exit instance')
                    instance.exit()
                })
                .catch(logger.error)

            // return the final result
            shared.onResolveResult(result)
        } catch (e) {
            logger.error(e)
        }
    })

    const resultPromise = openThrowable(url)
        .then(() => {
            const script = `function() { this.baseUrl = "${baseUrl}"; this.query = "${query}" }`
            return page.evaluateJavaScript(script)
        })
        .then(() => page.evaluate(tgramScript))
        .then(() => new Promise((resolve, reject) => {
            shared.onResolveResult = resolve
            shared.onRejectResult = reject
            logger.debug(`set scraping timeout to ${config.scrapingTimeoutMs}`)
            setTimeout(() => shared.onRejectResult(new Error('Scraping Timeout')), config.scrapingTimeoutMs)
        }))
        .catch(e => {
            logger.error(e)
            instancePromise
                .then(instance => {
                    logger.debug('exit instance due to failure')
                    instance.exit()
                })
                .catch(logger.error)
            return []
        })

    return resultPromise
}
