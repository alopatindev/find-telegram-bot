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

const onCreatePageMockEmpty = makeOnCreatePageMock(new Map())

const onCreatePageMockA = makeOnCreatePageMock(new Map([
    ['Abot', ' Whitespace and @spam eggs http://domain.com  '],
    ['Bbotty', 'Should not present in the output'],
    ['Cbot', 'Description will be overriden'],
    ['Dbot', 'Both name and description will be overriden'],
]))

const onCreatePageMockB = makeOnCreatePageMock(new Map([
    ['Cbot', 'New description'],
    ['dbot', 'New name and description'],
]))

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
        it('should merge empty maps', done => {
            const createPageCallbacks = {
                scraperA: onCreatePageMockEmpty,
                scraperB: onCreatePageMockEmpty,
            }

            const scrapers = new Scrapers(appObjectsMock, createPageCallbacks)
            scrapers
                .find('hello')
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
                .find('hello')
                .then(results => {
                    assert.ok(Array.isArray(results))

                    console.log(results)

                    const hasOldDescriptions =
                        results.includes('@Cbot — Description will be overriden') ||
                        results.includes('@Dbot — Both name and description will be overriden')

                    const hasNewDescriptions =
                        results.includes('@Cbot — New description') &&
                        results.includes('@dbot — New name and description')

                    assert.ok(!hasOldDescriptions)
                    assert.ok(hasNewDescriptions)
                })
                .then(done)
        })

        it('should ignore bots names case-sensitivity', done => {
            const createPageCallbacks = {
                scraperA: onCreatePageMockA,
                scraperB: onCreatePageMockB,
            }

            const scrapers = new Scrapers(appObjectsMock, createPageCallbacks)
            scrapers
                .find('hello')
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
                .find('hello')
                .then(results => {
                    assert.ok(Array.isArray(results))

                    const nameHasPostfixBot = results
                        .filter(line => /^@.*bot — .*$/.test(line))
                        .length === results.length

                    assert.ok(nameHasPostfixBot)
                })
                .then(done)
        })

        it('should sort by bot names', () => {})

        it('should trim description whitespace', () => {})

        it('should remove URLs from description', () => {})

        it('should remove @ from description', () => {})

        it('should remove new lines from description', () => {})
    })
})
