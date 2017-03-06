/*!
 * find-telegram-bot <https://github.com/alopatindev/find-telegram-bot>
 *
 * Copyright (c) 2017 Alexander Lopatin
 * Licensed under the MIT License
 */

'use strict'

const assert = require('assert')

const { createAppObjectsMock } = require('./utils.js')

const chars = require('../bot/chars.json')
const Scraper = require('../bot/scrapers/scraper.js')
const ScraperFacade = require('../bot/scrapers/scraper-facade.js')

function createOnCreatePage(phantomController, results) {
    return new Promise(resolve => {
        phantomController.exit()
        resolve(results)
    })
}

class ScraperStub extends Scraper {
    _onCreatePage(query, phantomController) {
        return createOnCreatePage(phantomController, [])
    }
}

class ScraperAMock extends Scraper {
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

class ScraperBMock extends Scraper {
    _onCreatePage(query, phantomController) {
        return createOnCreatePage(phantomController, [
            ['Cbot', 'New description'],
            ['dbot', 'New name and description'],
            [' Fbot  ', 'Bot name will be trimmed, /slash will be replaced'],
            ['G bot', 'Will be removed because of invalid name'],
            ['', 'Will be removed because of invalid name'],
            ['longbot', 'Very-very-very-very-very-very-very-very-very-very-very-very long description'],
            ['shortbot', `New name and description with dots..\t ${chars.dots}\t`],
        ])
    }
}

class ConnectScraperMock extends Scraper {
    _onCreatePage(query, phantomController) {
        const url = 'http://example.com'
        const scripts = ['function() { return [["dummy_bot", "dummy"]] }']

        const resultPromise = phantomController
            .openAndRun(url, scripts)
            .then(result => {
                phantomController.exit()
                return result
            })
            .catch(e => {
                phantomController.exit(e)
                return []
            })

        return resultPromise
    }
}

class OnCallbackScraperMock extends Scraper {
    _onCreatePage(query, phantomController) {
        const shared = {}
        const url = 'http://example.com'
        const scripts = [`
            function() {
                const timeoutMs = 100

                setTimeout(function() {
                    window.callPhantom([["dummy_bot", "dummy"]])
                }, timeoutMs) // emulate some activity
            }
        `]

        phantomController.setOnCallback(result => {
            try {
                phantomController.exit()

                // return the final result
                shared.onResolveResult(result)
            } catch (e) {
                shared.onRejectResult(e)
            }
        })

        const resultPromise = phantomController
            .openAndRun(url, scripts)
            .then(() => new Promise((resolve, reject) => {
                shared.onResolveResult = resolve
                shared.onRejectResult = reject
            }))
            .catch(e => {
                phantomController.exit(e)
                return []
            })

        return resultPromise
    }
}

class InvalidHostScraperMock extends Scraper {
    _onCreatePage(query, phantomController) {
        const url = 'https://invalid-host'
        const scripts = ['function() {}']

        const resultPromise = phantomController
            .openAndRun(url, scripts)
            .then(result => {
                phantomController.exit()
                return result // this will never happen
            })
            .catch(e => {
                phantomController.exit(e)
                return []
            })

        return resultPromise
    }
}

class WithoutScriptScraperMock extends Scraper {
    _onCreatePage(query, phantomController) {
        const baseUrl = 'http://example.com'
        const scripts = []

        const resultPromise = phantomController
            .openAndRun(baseUrl, scripts)
            .then(result => {
                phantomController.exit()
                return result // this will never happen
            })
            .catch(e => {
                phantomController.exit(e)
                return []
            })

        return resultPromise
    }
}

function createScrapersTestDouble(type, appObjects) {
    const generators = new Map()

    generators.set('stub', () => Object({ scraperA: new ScraperStub(appObjects), scraperB: new ScraperStub(appObjects) }))
    generators.set('mock', () => Object({ scraperA: new ScraperAMock(appObjects), scraperB: new ScraperBMock(appObjects) }))
    generators.set('connect-mock', () => Object({ scraper: new ConnectScraperMock(appObjects) }))
    generators.set('callback-mock', () => Object({ scraper: new OnCallbackScraperMock(appObjects) }))
    generators.set('invalid-host-mock', () => Object({ scraper: new InvalidHostScraperMock(appObjects) }))
    generators.set('without-script-mock', () => Object({ scraper: new WithoutScriptScraperMock(appObjects) }))

    assert(generators.has(type), `Unknown generator ${type}`)

    const result = generators.get(type)()
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
        .catch(done)
}

describe('ScraperFacade.find', () => {
    it('should merge empty results', done => testScrapers('stub', done, results => {
        assert.strictEqual(results.size, 0)
    }))

    it('should override previous descriptions', done => testScrapers('mock', done, results => {
        const hasOldDescriptions =
            results.get('c') === 'Description will be overriden' ||
            results.get('d') === 'Both name and description will be overriden'

        const hasNewDescriptions =
            results.get('c') === 'New description' &&
            results.get('d') === 'New name and description'

        assert(!hasOldDescriptions)
        assert(hasNewDescriptions)
    }))

    it('should have case-insensitive bot names', done => testScrapers('mock', done, results => {
        const hasOldName = results.has('D')
        const hasNewName = results.has('d')

        assert(!hasOldName)
        assert(hasNewName)
    }))

    it('should contain only bot names with postfix "bot"', done => testScrapers('mock', done, results => {
        const hasOnlyValidNames = Array.from(results.keys())
            .filter(name => name.endsWith('botty'))
            .length === 0

        assert(hasOnlyValidNames)
    }))

    it('should not contain postfix "bot"', done => testScrapers('mock', done, results => {
        const nameHasPostfix = Array.from(results.keys())
            .filter(name => name.endsWith('bot'))
            .length > 0

        assert(!nameHasPostfix)
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

    it('should truncate long descriptions and put a single dots character', done => testScrapers('mock', done, results => {
        assert.strictEqual(results.get('long'), `Very-very-very-very-very-very-very-very-very-very-very-very long descr${chars.dots}`)
    }))

    it('should replace all dots at the end of description with a single dots character', done => testScrapers('mock', done, results => {
        assert.strictEqual(results.get('short'), `New name and description with dots${chars.dots}`)
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

    it('should replace / with a similar character in description', done => testScrapers('mock', done, results => {
        const hasSlashChar = Array.from(results.values())
            .filter(description => description
                .slice(1)
                .includes('/'))
            .length > 0

        assert(!hasSlashChar)
        assert.strictEqual(results.get('f'), `Bot name will be trimmed, ${chars.fullwidthSolidus}slash will be replaced`)
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

    it('should be able to connect to existing server', done => testScrapers('connect-mock', done, results => {
        assert.strictEqual(results.get('dummy_'), 'dummy')
    }))

    it('should be able to return data with onCallback', done => testScrapers('callback-mock', done, results => {
        assert.strictEqual(results.get('dummy_'), 'dummy')
    }))

    it('should return empty result if connection error occuried', done => testScrapers('invalid-host-mock', done, results => {
        assert.strictEqual(results.size, 0)
    }))

    it('should return empty result if script is not set', done => testScrapers('without-script-mock', done, results => {
        assert.strictEqual(results.size, 0)
    }))
})
