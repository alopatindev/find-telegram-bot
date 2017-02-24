/*!
 * find-telegram-bot <https://github.com/alopatindev/find-telegram-bot>
 *
 * Copyright (c) 2017 Alexander Lopatin
 * Licensed under the MIT License
 */

'use strict'

const assert = require('assert')
const { createAppObjectsMock, logger } = require('./utils.js')

const Scraper = require('../bot/scrapers/scraper.js')
const ScraperFacade = require('../bot/scrapers/scraper-facade.js')

function createOnCreatePage(phantomController, results) {
    return new Promise(resolve => {
        phantomController.exit()
        resolve(results)
    })
}

class StubScraper extends Scraper {
    _onCreatePage(query, phantomController) {
        return createOnCreatePage(phantomController, [])
    }
}

class MockAScraper extends Scraper {
    _onCreatePage(query, phantomController) {
        return createOnCreatePage(phantomController, [
            ['Dbot', 'Both name and description will be overriden'],
            ['Bbotty', 'Should not present in the output'],
            ['Cbot', 'Description will be overriden'],
            ['Abot', ' Whitespace and @spam https://eggs.foo\nftp://bar http://domain.com \t '],
            ['Ebot', ' \t\n '],
        ])
    }
}

class MockBScraper extends Scraper {
    _onCreatePage(query, phantomController) {
        return createOnCreatePage(phantomController, [
            ['Cbot', 'New description'],
            ['dbot', 'New name and description'],
            [' Fbot  ', 'Bot name will be trimmed'],
            ['G bot', 'Will be removed because of invalid name'],
            ['', 'Will be removed because of invalid name'],
        ])
    }
}

function createScrapersTestDouble(type, appObjects) {
    let result = undefined

    if (type === 'stub') {
        result = {
            scraperA: new StubScraper(appObjects),
            scraperB: new StubScraper(appObjects),
        }
    } else if (type === 'mock') {
        result = {
            scraperA: new MockAScraper(appObjects),
            scraperB: new MockBScraper(appObjects),
        }
    } else {
        throw new Error('No such scrapers type')
    }

    appObjects.config.scrapers = Object.keys(result)

    return result
}

function testScrapers(type, done, testClosure) {
    const appObjectsMock = createAppObjectsMock()
    const scrapersTestDouble = createScrapersTestDouble(type, appObjectsMock)
    const scraperFacade = new ScraperFacade(appObjectsMock, scrapersTestDouble)

    scraperFacade
        .find('query')
        .then(testClosure)
        .then(done)
        .catch(logger.error)
}

describe('ScraperFacade', () => {
    it('should merge empty results', done => testScrapers('stub', done, results => {
        assert.strictEqual(results.size, 0)
    }))

    it('should override previous descriptions', done => testScrapers('mock', done, results => {
        const hasOldDescriptions =
            results.get('cbot') === 'Description will be overriden' ||
            results.get('dbot') === 'Both name and description will be overriden'

        const hasNewDescriptions =
            results.get('cbot') === 'New description' &&
            results.get('dbot') === 'New name and description'

        assert(!hasOldDescriptions)
        assert(hasNewDescriptions)
    }))

    it('should have case-insensitive bot names', done => testScrapers('mock', done, results => {
        const hasOldName = results.has('Dbot')
        const hasNewName = results.has('dbot')

        assert(!hasOldName)
        assert(hasNewName)
    }))

    it('should contain only bot names with postfix "bot"', done => testScrapers('mock', done, results => {
        const nameHasPostfixBot = Array.from(results.keys())
            .filter(name => name.endsWith('bot'))
            .length === results.size

        assert(nameHasPostfixBot)
    }))

    it('should trim description whitespace', done => testScrapers('mock', done, results => {
        const hasWhitespace = Array.from(results.values())
            .filter(description =>
                description.startsWith(' ') ||
                description.endsWith(' ') ||
                description.startsWith('\t') ||
                description.endsWith('\t'))
            .length > 0

        assert(!hasWhitespace)
    }))

    it('should remove URLs from description', done => testScrapers('mock', done, results => {
        const hasUrls = Array.from(results.values())
            .filter(description =>
                description.includes('https://') ||
                description.includes('http://') ||
                description.includes('ftp://'))
            .length > 0

        assert(!hasUrls)
    }))

    it('should remove @ from description', done => testScrapers('mock', done, results => {
        const hasAtChar = Array.from(results.values())
            .filter(description => description
                .slice(1)
                .includes('@'))
            .length > 0

        assert(!hasAtChar)
    }))

    it('should remove new lines from description', done => testScrapers('mock', done, results => {
        const hasNewLines = Array.from(results.values())
            .filter(description => description.includes('\n'))
            .length > 0

        assert(!hasNewLines)
    }))

    it('should contain non-empty descriptions', done => testScrapers('mock', done, results => {
        const hasEmptyDescriptions = Array.from(results.values())
            .filter(description => description.length === 0)
            .length > 0

        assert(!hasEmptyDescriptions)
    }))

    it('should trim bot names', done => testScrapers('mock', done, results => {
        const hasNamesWithWhitespace = Array.from(results.keys())
            .filter(name =>
                name.startsWith(' ') ||
                name.startsWith('\t') ||
                name.endsWith(' ') ||
                name.endsWith('\t'))
            .length === results.length

        assert(!hasNamesWithWhitespace)
    }))
})
