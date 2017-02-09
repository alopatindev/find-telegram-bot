'use strict'

const phantom = require('phantom')
const concatMaps = require('concat-maps')

const TEXT_FOUND_BOTS = 'Found bots: '

class SearchEngines {
    constructor(logger) {
        this.logger = logger
    }

    find(query) {
        // TODO: if cached then get
        return Promise
            .all([this.findInBotList(query), this.findInStoreBot(query)])
            .then(results => {
                const mergedResults = concatMaps.concat(...results)
                const text = Array
                    .from(mergedResults)
                    .map(([bot, description]) => `@${bot} — ${description}`)
                    .join('\n')

                return `${TEXT_FOUND_BOTS}${mergedResults.size}\n${text}`
            })
            .catch(this.logger.error)
    }

    findInBotList(query) {
        const instancePromise = phantom.create()

        const pagePromise = instancePromise
            .then(instance => instance.createPage())

        return pagePromise
            .then(page => {
                page.on('onResourceRequested', requestData => {
                    this.logger.debug(`requesting: ${requestData}`)
                })

                return page
                    .open('https://botlist.co')
                    .then(status => {
                        this.logger.debug(`status=${status}`)
                        return pagePromise
                    })
                    .then(page => page.property('content'))
                    .then(content => {
                        this.logger.debug(`content length: ${content.length}`)
                        return instancePromise

                    })
                    .then(instance => {
                        this.logger.debug('exit instance!')
                        instance.exit()
                        return new Map()
                    })
                    .catch(this.logger.error)
            })
            .catch(this.logger.error)
    }

    findInStoreBot(query) {
        return new Promise(resolve => {
            const results = new Map([
                ['test1', 'teeest'],
            ])
            resolve(results)
        })
    }
}

module.exports = SearchEngines
