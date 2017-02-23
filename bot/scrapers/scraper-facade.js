/*!
 * find-telegram-bot <https://github.com/alopatindev/find-telegram-bot>
 *
 * Copyright (c) 2017 Alexander Lopatin
 * Licensed under the MIT License
 */

'use strict'

const StorebotScraper = require('./storebot-scraper.js')
const TgramScraper = require('./tgram-scraper.js')

const BOT_POSTFIX = 'bot'

const DOTS_CHARACTER_CODE = 8230
const DOTS_CHARACTER = String.fromCharCode(DOTS_CHARACTER_CODE)

function flatten(arrays) {
    return [].concat(...arrays)
}

class ScraperFacade {
    constructor(appObjects, scrapers) {
        this._config = appObjects.config
        this._logger = appObjects.logger

        if (scrapers === undefined) {
            const defaultScrapers = {
                storebot: new StorebotScraper(appObjects),
                tgram: new TgramScraper(appObjects),
            }

            this._scrapers = defaultScrapers
        } else {
            this._scrapers = scrapers
        }
    }

    /**
     * Find bots
     * @param {String} query query
     * @return {Promise} find
     */
    find(query) {
        // TODO: if cached then get
        const scraperPromises = this
            ._config
            .scrapers
            .map(scraper => this._scrapers[scraper].find(query))

        return Promise
            .all(scraperPromises)
            .then(results => this._mergeAndFormatResults(results))
            .catch(this._logger.error)
    }

    _filterDescription(text) {
        let result = text
            .replace(/[@\n]/g, '')
            .replace(/(?:https?|ftp):\/\/[\n\S]+/g, '')
            .trim()

        const maxLength = this._config.message.descriptionMaxLength
        if (result.length > maxLength) {
            result = result.slice(0, maxLength)
            const hasDots = result.endsWith('...') || result.endsWith(DOTS_CHARACTER)

            if (!hasDots) {
                result = `${result}${DOTS_CHARACTER}`
            }
        }

        return result
    }

    _isValidResult(result) {
        const [name, description] = result
        const nameHasWhitespace = name.includes(' ') || name.includes('\t')
        const descriptionIsEmpty = description.length === 0
        return name.endsWith(BOT_POSTFIX) && !nameHasWhitespace && !descriptionIsEmpty
    }

    _mergeResults(results) {
        const updatedResults = flatten(results)
            .map(([name, description]) => [
                name.toLowerCase().trim(),
                this._filterDescription(description),
            ])
            .filter(result => this._isValidResult(result))

        return new Map(updatedResults)
    }

    _mergeAndFormatResults(results) {
        const mergedResults = this._mergeResults(results)

        const lines = Array
            .from(mergedResults)
            .sort()
            .map(([name, description]) => `@${name} — ${description}`)

        this._logger.debug(`lines.length = ${lines.length}`)

        return lines
    }
}

module.exports = ScraperFacade
