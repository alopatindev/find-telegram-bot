'use strict'

const phantomjs = require('phantom')
const concatMaps = require('concat-maps')

const commonBrowserScripts = require('./browser-scripts/common.js')
const storeBotBrowserScript = require('./browser-scripts/storebot.js')
const tgramBrowserScript = require('./browser-scripts/tgram.js')

const USER_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_0 like Mac OS X) AppleWebKit/602.1.38 (KHTML, like Gecko) Version/10.0 Mobile/14A5297c Safari/602.1'
const BOT_POSTFIX = 'bot'

const MAX_DESCRIPTION_LENGTH = 100

const DOTS_CHARACTER_CODE = 8230
const DOTS_CHARACTER = String.fromCharCode(DOTS_CHARACTER_CODE)

function filterText(text) {
    let result = text
        .trim()
        .replace(/[@\n]/g, '')
        .replace(/(?:https?|ftp):\/\/[\n\S]+/g, '')

    if (result.length > MAX_DESCRIPTION_LENGTH) {
        result = result.slice(0, MAX_DESCRIPTION_LENGTH)
        const hasDots = result.endsWith('...') || result.endsWith(DOTS_CHARACTER)

        if (!hasDots) {
            result = `${result}${DOTS_CHARACTER}`
        }
    }

    return result
}

function createPage(query, callback) {
    const instancePromise = phantomjs
        .create([
            '--load-images=no',
            '--web-security=false',
            '--ignore-ssl-errors=true',
            //'--debug=true',
        ], {
            //logger: this.logger,
        })
        .catch(this.logger.error)

    const pagePromise = instancePromise
        .then(instance => instance.createPage())
        .catch(this.logger.error)

    return pagePromise
        .then(page => callback.bind(this)(page, instancePromise, query))
        .catch(this.logger.error)
}

function onStoreBotCreatePage(page, instancePromise, query) {
    const baseUrl = 'https://storebot.me'
    const url = encodeURI(`${baseUrl}/search?text=${query}`)
    page.setting('userAgent', USER_AGENT)
    page.property('onConsoleMessage', commonBrowserScripts.onConsoleMessage)

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
        .then(() => page.evaluate(storeBotBrowserScript))
        .then(result => {
            // instance is phantom in phantom context
            instancePromise
                .then(instance => {
                    this.logger.debug('exit instance')
                    instance.exit()
                })
                .catch(this.logger.error)
            return new Map(result)
        })
        .catch(e => {
            this.logger.error(e)
            instancePromise
                .then(instance => {
                    this.logger.debug('exit instance due to failure')
                    instance.exit()
                })
                .catch(this.logger.error)
            return new Map()
        })
}

function onTgramCreatePage(page, instancePromise, query) {
    const baseUrl = 'https://tgram.ru'
    const url = encodeURI(`${baseUrl}/bots`)
    page.setting('userAgent', USER_AGENT)
    page.property('onConsoleMessage', commonBrowserScripts.onConsoleMessage)

    return page
        .open(url)
        .then(status => {
            if (status !== 'success') {
                throw new Error(`Failed to load '${url}' status=${status}`)
            }
        })
        .then(() => {
            const script = `function() { this.baseUrl = "${baseUrl}"; this.query = "${query}" }`
            return page.evaluateJavaScript(script)
        })
        .then(() => page.evaluate(tgramBrowserScript))
        .then(result => {
            // instance is phantom in phantom context
            page.render('test.png')
            instancePromise
                .then(instance => {
                    this.logger.debug('exit instance')
                    instance.exit()
                })
                .catch(this.logger.error)
            return new Map(result)
        })
        .catch(e => {
            this.logger.error(e)
            instancePromise
                .then(instance => {
                    this.logger.debug('exit instance due to failure')
                    instance.exit()
                })
                .catch(this.logger.error)
            return new Map()
        })
}

class SearchEngines {
    constructor(logger) {
        this.logger = logger
    }

    /**
     * Finds bots
     * @param {String} query query
     * @return {Promise} find
     */
    find(query) {
        // TODO: if cached then get
        return Promise
            .all([this.findInStoreBot(query), this.findInTgram(query)])
            .then(results => {
                const mergedResults = concatMaps.concat(...results)
                const lines = Array
                    .from(mergedResults)
                    .filter(botAndDescription => botAndDescription[0].toLowerCase().endsWith(BOT_POSTFIX))
                    .sort()
                    .map(([bot, description]) => `@${bot} — ${filterText(description)}`)
                this.logger.debug(`lines.length = ${lines.length}`)
                return lines
            })
            .catch(this.logger.error)
    }

    findInStoreBot(query) {
        return createPage.bind(this)(query, onStoreBotCreatePage)
    }

    findInTgram(query) {
        return createPage.bind(this)(query, onTgramCreatePage)
    }
}

module.exports = SearchEngines
