'use strict'

const phantomjs = require('phantom')
const concatMaps = require('concat-maps')
const commonBrowserScripts = require('./browser-scripts/common.js')
const storeBotBrowserScript = require('./browser-scripts/storebot.js')

const USER_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_0 like Mac OS X) AppleWebKit/602.1.38 (KHTML, like Gecko) Version/10.0 Mobile/14A5297c Safari/602.1'
const JQUERY_URL = 'https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js'
const MAX_DESCRIPTION_LENGTH = 100
const DOTS_CHARACTER = String.fromCharCode(8230)

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

class SearchEngines {
    constructor(logger) {
        this.logger = logger
    }

    find(query) {
        // TODO: if cached then get
        return Promise
            .all([this.findInStoreBot(query), this.findInTgram(query)])
            .then(results => {
                const mergedResults = concatMaps.concat(...results)
                const lines = Array
                    .from(mergedResults)
                    .filter(botAndDescription => botAndDescription[0].endsWith('bot'))
                    .map(([bot, description]) => `@${bot} — ${filterText(description)}`)
                this.logger.debug(`lines.length = ${lines.length}`)
                return lines
            })
            .catch(this.logger.error)
    }

    findInStoreBot(query) {
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
            .then(page => this.onStoreBotCreatePage(page, instancePromise, query))
            .catch(this.logger.error)
    }

    findInTgram(query) {
        return new Promise(resolve => {
            const results = new Map([
                ['test1', 'teeest'],
            ])
            resolve(results)
        })
    }

    onStoreBotCreatePage(page, instancePromise, query) {
        const baseUrl = 'https://storebot.me'
        const url = encodeURI(`${baseUrl}/search?text=${query}`)
        page.setting('userAgent', USER_AGENT)
        page.property('onConsoleMessage', commonBrowserScripts.onConsoleMessage)

        return page
            .open(url)
            .then(status => {
                if (status !== 'success') {
                    this.logger.error(`Failed to load '${url}' status=${status}`)
                }

                page.includeJs(JQUERY_URL)
            })
            .then(() => page.property('content'))
            .then(content => {
                this.logger.debug(`content length: ${content.length}`)
                const result = page
                    .evaluate(storeBotBrowserScript)
                    .catch(this.logger.error)
                this.logger.debug(`result = ${result}`)
                return result
            })
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
            .catch(this.logger.error)
    }
}

module.exports = SearchEngines