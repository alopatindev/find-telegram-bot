/*!
 * find-telegram-bot <https://github.com/alopatindev/find-telegram-bot>
 *
 * Copyright (c) 2017 Alexander Lopatin
 * Licensed under the MIT License
 */

'use strict'

const BOT_POSTFIX = 'bot'
const chars = require('../chars.json')

function flatten(arrays) {
    return [].concat(...arrays)
}

function isValidName(name) {
    const hasWhitespace = name.includes(' ') || name.includes('\t')
    const hasPostfix = name.endsWith(BOT_POSTFIX)
    return !hasWhitespace && hasPostfix
}

function isValidDescription(description) {
    return description.length > 0
}

function isValidResult(result) {
    const [name, description] = result
    return name !== undefined && description !== undefined
}

function maybeAddDotsPostfix(description, truncated) {
    let result = description
    let needDotsPostfix = truncated

    const dotsPostfixPattern = new RegExp(`[ \t.${chars.dots}]+$`)
    const resultWithoutDots = result.replace(dotsPostfixPattern, '')

    if (resultWithoutDots.length < result.length) {
        result = resultWithoutDots
        needDotsPostfix = true
    }

    if (needDotsPostfix) {
        result = `${result}${chars.dots}`
    }

    return result
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

    _mergeAndFilterResults(results) {
        const updatedResults = flatten(results)
            .map(([name, description]) => [
                this._filterName(name),
                this._filterDescription(description),
            ])
            .filter(result => isValidResult(result))

        return new Map(updatedResults)
    }

    _filterName(name) {
        const trimmedName = name
            .toLowerCase()
            .trim()

        if (isValidName(trimmedName)) {
            return trimmedName.replace(/bot$/, '')
        } else {
            return undefined
        }
    }

    _filterDescription(description) {
        let result = description
            .replace(/(?:https?|ftp):\/\/[\n\S]+/g, '')
            .replace(/[@\n]/g, '')
            .replace('/', chars.fullwidthSolidus)
            .trim()

        let truncated = false
        const maxLength = this._config.message.descriptionMaxLength
        if (result.length > maxLength) {
            result = result.slice(0, maxLength)
            truncated = true
        }

        if (isValidDescription(result)) {
            return maybeAddDotsPostfix(result, truncated)
        } else {
            return undefined
        }
    }
}

module.exports = ScraperFacade
