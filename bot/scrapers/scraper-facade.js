/*!
 * find-telegram-bot <https://github.com/alopatindev/find-telegram-bot>
 *
 * Copyright (c) 2017 Alexander Lopatin
 * Licensed under the MIT License
 */

'use strict'

const BOT_POSTFIX = 'bot'

const DOTS_CHARACTER_CODE = 8230
const DOTS_CHARACTER = String.fromCharCode(DOTS_CHARACTER_CODE)

function flatten(arrays) {
    return [].concat(...arrays)
}

function isValidResult(result) {
    const [name, description] = result
    const nameHasWhitespace = name.includes(' ') || name.includes('\t')
    const descriptionIsEmpty = description.length === 0
    return name.endsWith(BOT_POSTFIX) && !nameHasWhitespace && !descriptionIsEmpty
}

class ScraperFacade {
    constructor(appObjects, scrapers) {
        this._config = appObjects.config
        this._logger = appObjects.logger
        this._scrapers = scrapers
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
            .then(results => this._mergeAndFilterResults(results))
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

    _mergeAndFilterResults(results) {
        const updatedResults = flatten(results)
            .map(([name, description]) => [
                name.toLowerCase().trim(),
                this._filterDescription(description),
            ])
            .filter(result => isValidResult(result))

        return new Map(updatedResults)
    }
}

module.exports = ScraperFacade
