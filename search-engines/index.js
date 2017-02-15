'use strict'

const phantomjs = require('phantom')
const concatMaps = require('concat-maps')

const commonScripts = require('./browser-scripts/common.js')
const storeBotScript = require('./browser-scripts/storebot.js')
const tgramScript = require('./browser-scripts/tgram.js')

const USER_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_0 like Mac OS X) AppleWebKit/602.1.38 (KHTML, like Gecko) Version/10.0 Mobile/14A5297c Safari/602.1'
const BOT_POSTFIX = 'bot'

const DOTS_CHARACTER_CODE = 8230
const DOTS_CHARACTER = String.fromCharCode(DOTS_CHARACTER_CODE)

function filterText(text) {
    let result = text
        .trim()
        .replace(/[@\n]/g, '')
        .replace(/(?:https?|ftp):\/\/[\n\S]+/g, '')

    if (result.length > this.config.message.descriptionMaxLength) {
        result = result.slice(0, this.config.message.descriptionMaxLength)
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
        .then(() => page.evaluate(storeBotScript))
        .then(result => {
            // instance is phantom in phantom context
            instancePromise
                .then(instance => {
                    this.logger.debug('exit instance')
                    instance.exit()
                })
                .catch(this.logger.error)

            // return the final result
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
    const self = this

    const baseUrl = 'https://tgram.ru'
    const url = encodeURI(`${baseUrl}/bots`)

    page.setting('userAgent', USER_AGENT)
    page.property('onConsoleMessage', commonScripts.onConsoleMessage)

    page.on('onCallback', result => {
        try {
            instancePromise
                .then(instance => {
                    self.logger.debug('exit instance')
                    instance.exit()
                })
                .catch(self.logger.error)

            // return the final result
            self.onResolveResult(new Map(result))
        } catch (e) {
            self.logger.error(e)
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
                self.onResolveResult = resolve
                self.onRejectResult = reject
                self.logger.debug(`set scraping timeout to ${self.config.scrapingTimeoutMs}`)
                setTimeout(() => self.onRejectResult(new Error('Scraping Timeout')), self.config.scrapingTimeoutMs)
            })
        )
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

    return resultPromise
}

class SearchEngines {
    constructor(logger, config) {
        this.logger = logger
        this.config = config
    }

    /**
     * Finds bots
     * @param {String} query query
     * @return {Promise} find
     */
    find(query) {
        const self = this
        // TODO: if cached then get
        return Promise
            .all([this.findInTgram(query), this.findInStoreBot(query)])
            .then(results => {
                const mergedResults = concatMaps.concat(...results)
                const lines = Array
                    .from(mergedResults)
                    .filter(botAndDescription => botAndDescription[0]
                        .toLowerCase()
                        .endsWith(BOT_POSTFIX))
                    .sort() // FIXME: compare bot names only
                    .map(([bot, description]) => `@${bot} — ${filterText.bind(self)(description)}`)
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
