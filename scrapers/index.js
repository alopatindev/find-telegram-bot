'use strict'

const assert = require('assert')
const phantomjs = require('phantom')

const commonScripts = require('./browser-scripts/common.js')
const onStorebotCreatePage = require('./storebot-create-page.js')
const onTgramCreatePage = require('./tgram-create-page.js')

const defaultCreatePageCallbacks = {
    storebot: onStorebotCreatePage,
    tgram: onTgramCreatePage,
}

const USER_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_0 like Mac OS X) AppleWebKit/602.1.38 (KHTML, like Gecko) Version/10.0 Mobile/14A5297c Safari/602.1'
const BOT_POSTFIX = 'bot'

const DOTS_CHARACTER_CODE = 8230
const DOTS_CHARACTER = String.fromCharCode(DOTS_CHARACTER_CODE)

function flatten(arrays) {
    return [].concat(...arrays)
}

function filterDescription(text, config) {
    let result = text
        .replace(/[@\n]/g, '')
        .replace(/(?:https?|ftp):\/\/[\n\S]+/g, '')
        .trim()

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

function mergeAndFormatResults(results, appObjects) {
    const {
        config,
        logger,
    } = appObjects

    const updatedResults = flatten(results)
        .map(([name, description]) => [
            name.toLowerCase(),
            filterDescription(description, config),
        ])
        .filter(result => result[0].endsWith(BOT_POSTFIX))

    const mergedResults = new Map(updatedResults)

    const lines = Array
        .from(mergedResults)
        .sort()
        .map(([name, description]) => `@${name} — ${description}`)

    logger.debug(`lines.length = ${lines.length}`)

    return lines
}

function findWithScraper(query, scraper, createPageCallbacks, appObjects) {
    assert(createPageCallbacks.hasOwnProperty(scraper), `Unknown scraper "${scraper}"! Please check your config`)
    return createPage(query, createPageCallbacks[scraper], appObjects)
}

class Scrapers {
    constructor(appObjects, createPageCallbacks = defaultCreatePageCallbacks) {
        this.appObjects = appObjects
        this.createPageCallbacks = createPageCallbacks
    }

    /**
     * Find bots
     * @param {String} query query
     * @return {Promise} find
     */
    find(query) {
        // TODO: if cached then get
        const scraperPromises = this
            .appObjects
            .config
            .scrapers
            .map(scraper => findWithScraper(query, scraper, this.createPageCallbacks, this.appObjects))

        return Promise
            .all(scraperPromises)
            .then(results => mergeAndFormatResults(results, this.appObjects))
            .catch(this.appObjects.logger.error)
    }
}

module.exports = Scrapers
