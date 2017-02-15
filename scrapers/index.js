'use strict'

const assert = require('assert')
const phantomjs = require('phantom')
const concatMaps = require('concat-maps')

const commonScripts = require('./browser-scripts/common.js')
const storebotScript = require('./browser-scripts/storebot.js')
const tgramScript = require('./browser-scripts/tgram.js')

const USER_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_0 like Mac OS X) AppleWebKit/602.1.38 (KHTML, like Gecko) Version/10.0 Mobile/14A5297c Safari/602.1'
const BOT_POSTFIX = 'bot'

const DOTS_CHARACTER_CODE = 8230
const DOTS_CHARACTER = String.fromCharCode(DOTS_CHARACTER_CODE)

function filterText(text, config) {
    let result = text
        .trim()
        .replace(/[@\n]/g, '')
        .replace(/(?:https?|ftp):\/\/[\n\S]+/g, '')

    if (result.length > config.message.descriptionMaxLength) {
        result = result.slice(0, config.message.descriptionMaxLength)
        const hasDots = result.endsWith('...') || result.endsWith(DOTS_CHARACTER)

        if (!hasDots) {
            result = `${result}${DOTS_CHARACTER}`
        }
    }

    return result
}

function createPage(query, callback, appObjects) {
    const {
        logger,
    } = appObjects

    const instancePromise = phantomjs
        .create([
            '--load-images=no',
            '--web-security=false',
            '--ignore-ssl-errors=true',
            //'--debug=true',
        ], {
            //logger,
        })
        .catch(logger.error)

    const pagePromise = instancePromise
        .then(instance => instance.createPage())
        .catch(logger.error)

    return pagePromise
        .then(page => {
            const phantomObjects = {
                instancePromise,
                page,
            }

            return callback(query, phantomObjects, appObjects)
        })
        .catch(logger.error)
}

function onStorebotCreatePage(query, phantomObjects, appObjects) {
    const {
        page,
        instancePromise,
    } = phantomObjects

    const {
        logger,
    } = appObjects

    const baseUrl = 'https://storebot.me'
    const url = encodeURI(`${baseUrl}/search?text=${query}`)

    page.setting('userAgent', USER_AGENT)
    page.property('onConsoleMessage', commonScripts.onConsoleMessage)

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

function onTgramCreatePage(query, phantomObjects, appObjects) {
    const {
        page,
        instancePromise,
    } = phantomObjects

    const {
        logger,
        config,
    } = appObjects

    const shared = {}

    const baseUrl = 'https://tgram.ru'
    const url = encodeURI(`${baseUrl}/bots`)

    page.setting('userAgent', USER_AGENT)
    page.property('onConsoleMessage', commonScripts.onConsoleMessage)

    page.on('onCallback', result => {
        try {
            instancePromise
                .then(instance => {
                    logger.debug('exit instance')
                    instance.exit()
                })
                .catch(logger.error)

            // return the final result
            shared.onResolveResult(new Map(result))
        } catch (e) {
            logger.error(e)
        }
    })

    const resultPromise = page
        .open(url)
        .then(() => {
            const script = `function() { this.baseUrl = "${baseUrl}"; this.query = "${query}" }`
            return page.evaluateJavaScript(script)
        })
        .then(() => page.evaluate(tgramScript))
        .then(() =>
            new Promise((resolve, reject) => {
                shared.onResolveResult = resolve
                shared.onRejectResult = reject
                logger.debug(`set scraping timeout to ${config.scrapingTimeoutMs}`)
                setTimeout(() => shared.onRejectResult(new Error('Scraping Timeout')), config.scrapingTimeoutMs)
            })
        )
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

    return resultPromise
}

const onCreatePageCallbacks = {
    storebot: onStorebotCreatePage,
    tgram: onTgramCreatePage,
}

class Scrapers {
    constructor(config, logger) {
        this.config = config
        this.logger = logger
    }

    /**
     * Find bots
     * @param {String} query query
     * @return {Promise} find
     */
    find(query) {
        // TODO: if cached then get
        const scraperPromises = this
            .config
            .scrapers
            .map(scraper => this.findWith(scraper, query))

        const self = this

        return Promise
            .all(scraperPromises)
            .then(results => {
                const mergedResults = concatMaps.concat(...results)

                const lines = Array
                    .from(mergedResults)
                    .filter(botAndDescription => botAndDescription[0]
                        .toLowerCase()
                        .endsWith(BOT_POSTFIX))
                    .sort() // FIXME: compare bot names only
                    .map(([bot, description]) => `@${bot} — ${filterText(description, self.config)}`)

                this.logger.debug(`lines.length = ${lines.length}`)

                return lines
            })
            .catch(this.logger.error)
    }

    findWith(scraper, query) {
        assert(onCreatePageCallbacks.hasOwnProperty(scraper), `Unknown scraper "${scraper}"! Please check your config`)

        const appObjects = {
            config: this.config,
            logger: this.logger,
        }

        return createPage(query, onCreatePageCallbacks[scraper], appObjects)
    }
}

module.exports = Scrapers
