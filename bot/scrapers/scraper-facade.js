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

function isValidNameAndDescription(value) {
    const [name, description] = value
    const nameHasWhitespace = name.includes(' ') || name.includes('\t')
    const descriptionIsEmpty = description.length === 0
    return name.endsWith(BOT_POSTFIX) && !nameHasWhitespace && !descriptionIsEmpty
}

function mergeAndFormatResults(results, appObjects) {
    const {
        config,
        logger,
    } = appObjects

    const updatedResults = flatten(results)
        .map(([name, description]) => [
            name.toLowerCase().trim(),
            filterDescription(description, config),
        ])
        .filter(isValidNameAndDescription)

    const mergedResults = new Map(updatedResults)

    const lines = Array
        .from(mergedResults)
        .sort()
        .map(([name, description]) => `@${name} — ${description}`)

    logger.debug(`lines.length = ${lines.length}`)

    return lines
}

class ScraperFacade {
    constructor(appObjects, scrapers) {
        this.appObjects = appObjects

        if (scrapers === undefined) {
            const defaultScrapers = {
                storebot: new StorebotScraper(appObjects),
                tgram: new TgramScraper(appObjects),
            }

            this.scrapers = defaultScrapers
        } else {
            this.scrapers = scrapers
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
            .appObjects
            .config
            .scrapers
            .map(scraper => this.scrapers[scraper].find(query)) // FIXME

        return Promise
            .all(scraperPromises)
            .then(results => mergeAndFormatResults(results, this.appObjects))
            .catch(this.appObjects.logger.error)
    }
}

module.exports = ScraperFacade
