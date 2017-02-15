'use strict'

const storebotScript = require('./browser-scripts/storebot.js')

module.exports = (query, phantomObjects, appObjects) => {
    const {
        page,
        instancePromise,
    } = phantomObjects

    const {
        logger,
    } = appObjects

    const baseUrl = 'https://storebot.me'
    const url = encodeURI(`${baseUrl}/search?text=${query}`)

    return page
        .open(url)
        .then(status => {
            if (status !== 'success') {
                throw new Error(`Failed to load '${url}' status=${status}`)
            }
        })
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
            return new Map(result)
        })
        .catch(e => {
            logger.error(e)
            instancePromise
                .then(instance => {
                    logger.debug('exit instance due to failure')
                    instance.exit()
                })
                .catch(logger.error)
            return new Map()
        })
}