'use strict'

const assert = require('assert')

const Scrapers = require('../scrapers')

function makeOnCreatePageMock(results) {
    const callback = (query, phantomObjects, appObjects) => {
        return new Promise(resolve => {
            phantomObjects
                .instancePromise
                .then(instance => instance.exit())
            resolve(results)
        })
    }

    return callback
}

const onCreatePageMockEmpty = makeOnCreatePageMock([])

const onCreatePageMockA = makeOnCreatePageMock([
    ['Abot', ' Whitespace and @spam eggs http://domain.com  '],
    ['Bbotty', 'Should not present in the output'],
    ['Cbot', 'Description will be overriden'],
    ['Dbot', 'Both name and description will be overriden'],
])

const onCreatePageMockB = makeOnCreatePageMock([
    ['Cbot', 'New description'],
    ['dbot', 'New name and description'],
])

const stubFunction = () => undefined

describe('Scrapers', () => {
    const appObjectsMock = {
        config: {
            scrapers: ['scraperA', 'scraperB'],
            message: {
                maxLines: 30,
                descriptionMaxLength: 100,
            },
        },

        logger: {
            debug: stubFunction,
            info: stubFunction,
        },
    }

    describe('#find()', () => {
        it('should merge empty results', done => {
            const createPageCallbacks = {
                scraperA: onCreatePageMockEmpty,
                scraperB: onCreatePageMockEmpty,
            }

            const scrapers = new Scrapers(appObjectsMock, createPageCallbacks)
            scrapers
                .find('query')
                .then(results => {
                    assert.ok(Array.isArray(results))
                    assert.strictEqual(results.length, 0)
                })
                .then(done)
        })

        it('should override previous descriptions', done => {
            const createPageCallbacks = {
                scraperA: onCreatePageMockA,
                scraperB: onCreatePageMockB,
            }

            const scrapers = new Scrapers(appObjectsMock, createPageCallbacks)
            scrapers
                .find('query')
                .then(results => {
                    assert.ok(Array.isArray(results))

                    const hasOldDescriptions =
                        results.includes('@cbot — Description will be overriden') ||
                        results.includes('@dbot — Both name and description will be overriden')

                    const hasNewDescriptions =
                        results.includes('@cbot — New description') &&
                        results.includes('@dbot — New name and description')

                    assert.ok(!hasOldDescriptions)
                    assert.ok(hasNewDescriptions)
                })
                .then(done)
        })

        it('should have case-insensitive bot names', done => {
            const createPageCallbacks = {
                scraperA: onCreatePageMockA,
                scraperB: onCreatePageMockB,
            }

            const scrapers = new Scrapers(appObjectsMock, createPageCallbacks)
            scrapers
                .find('query')
                .then(results => {
                    assert.ok(Array.isArray(results))

                    const hasOldNames = results
                        .filter(line => line.startsWith('@Dbot'))
                        .length > 0

                    const hasNewName = results
                        .filter(line => line.startsWith('@dbot'))
                        .length === 1

                    assert.ok(!hasOldNames)
                    assert.ok(hasNewName)
                })
                .then(done)
        })

        it('should contain only bot names with postfix "bot"', done => {
            const createPageCallbacks = {
                scraperA: onCreatePageMockA,
                scraperB: onCreatePageMockB,
            }

            const scrapers = new Scrapers(appObjectsMock, createPageCallbacks)
            scrapers
                .find('query')
                .then(results => {
                    assert.ok(Array.isArray(results))

                    const nameHasPostfixBot = results
                        .filter(line => /^@.*bot — .*$/.test(line))
                        .length === results.length

                    assert.ok(nameHasPostfixBot)
                })
                .then(done)
        })

        it('should trim description whitespace', done => {
            const createPageCallbacks = {
                scraperA: onCreatePageMockA,
                scraperB: onCreatePageMockB,
            }

            const scrapers = new Scrapers(appObjectsMock, createPageCallbacks)
            scrapers
                .find('query')
                .then(results => {
                    assert.ok(Array.isArray(results))

                    const hasWhitespace = results
                        .filter(line =>
                            line.startsWith(' ') ||
                            line.endsWith(' ') ||
                            line.startsWith('\t') ||
                            line.endsWith('\t'))
                        .length > 0

                    assert.ok(!hasWhitespace)
                })
                .then(done)
        })

        it('should remove URLs from description', () => {
            assert.ok(false)
        })

        it('should remove @ from description', () => {
            assert.ok(false)
        })

        it('should remove new lines from description', () => {
            assert.ok(false)
        })

        it('should sort by bot names', () => {
            assert.ok(false)
        })
    })
})
