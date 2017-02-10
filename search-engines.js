'use strict'

const phantomjs = require('phantom')
const concatMaps = require('concat-maps')

const TEXT_FOUND_BOTS = 'Found bots: '
const USER_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_0 like Mac OS X) AppleWebKit/602.1.38 (KHTML, like Gecko) Version/10.0 Mobile/14A5297c Safari/602.1'

// FIXME: put phantom context code into a separate file
function storeBotBrowserScript() {
    const MAX_DESCRIPTION_LENGTH = 40

    try {
        console.debug('storeBotBrowserScript')

        const botItems = $('.botitem').find('.info')
        const urls = botItems.find('a')
        const descriptions = botItems.find('.description')

        var result = [] // FIXME: make immutable?
        for (var i = 0; i < urls.length; i++) {
            const botName = urls[i]
                .href
                .replace('https://storebot.me/bot/', '') // FIXME
            const description = descriptions[i]
                .innerText
                .trim()
                .replace('\n', '') // FIXME
                .replace('@', '')
                .slice(0, MAX_DESCRIPTION_LENGTH)
            result.push([botName, description])
        }

        console.debug('storeBotBrowserScript end')
        return result
    } catch (e) {
        console.error(e)
    }
}

function onStoreBotCreatePage(page, pagePromise, instancePromise, query) {
    page.setting('userAgent', USER_AGENT)

    page.property('onConsoleMessage', function(message) {
        console.debug('onConsoleMessage ' + message)
    })

    const url = encodeURI(`https://storebot.me/search?text=${query}`)
    return page
        .open(url)
        .then(status => {
            if (status !== 'success') {
                this.logger.error(`Failed to load '${url}' status=${status}`)
            }

            page.includeJs('http://ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js')
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
                const text = Array
                    .from(mergedResults)
                    .filter(([bot, description]) => bot.endsWith('bot'))
                    .map(([bot, description]) => `@${bot} — ${description}`)
                    .join('\n')

                return `${TEXT_FOUND_BOTS}${mergedResults.size}\n${text}`
            })
            .catch(this.logger.error)
    }

    findInStoreBot(query) {
        const instancePromise = phantomjs
            .create(
                [
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
            .then(page => onStoreBotCreatePage.bind(this)(page, pagePromise, instancePromise, query))
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
}

module.exports = SearchEngines
