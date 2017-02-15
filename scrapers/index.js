'use strict'

const assert = require('assert')
const phantomjs = require('phantom')
const concatMaps = require('concat-maps')

const commonScripts = require('./browser-scripts/common.js')
const onStorebotCreatePage = require('./storebot-create-page.js')
const onTgramCreatePage = require('./tgram-create-page.js')

const onCreatePageCallbacks = {
    storebot: onStorebotCreatePage,
    tgram: onTgramCreatePage,
}

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
            page.setting('userAgent', USER_AGENT)
            page.property('onConsoleMessage', commonScripts.onConsoleMessage)

            const phantomObjects = {
                instancePromise,
                page,
            }

            return callback(query, phantomObjects, appObjects)
        })
        .catch(logger.error)
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
