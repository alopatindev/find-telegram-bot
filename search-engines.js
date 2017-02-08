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
        return new Promise(resolve => {
            const results = new Map([
                ['test2', 'teeest'],
            ])
            resolve(results)
        })
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
