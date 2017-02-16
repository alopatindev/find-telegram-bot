/*!
 * find-telegram-bot <https://github.com/alopatindev/find-telegram-bot>
 *
 * Copyright (c) 2017 Alexander Lopatin
 * Licensed under the MIT License
 */

'use strict'

const storebotScript = require('./browser-scripts/storebot.js')

module.exports = (query, phantomObjects, appObjects) => {
    const {
        page,
        openThrowable,
        instancePromise,
    } = phantomObjects

    const {
        logger,
    } = appObjects

    const baseUrl = 'https://storebot.me'
    const url = encodeURI(`${baseUrl}/search?text=${query}`)

    const resultPromise = openThrowable(url)
        .then(() => {
            const script = `function() { this.baseUrl = "${baseUrl}" }`
            page.evaluateJavaScript(script)
        })
        .then(() => page.evaluate(storebotScript))
        .then(result => {
            // instance is phantom in phantom context
            instancePromise
                .then(instance => {
                    logger.debug('exit instance')
                    instance.exit()
                })
                .catch(logger.error)

            // return the final result
            return result
        })
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
