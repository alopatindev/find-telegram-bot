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

const onCreatePageEmptyMock = makeOnCreatePageMock(new Map())

const stubFunction = () => undefined

describe('Scrapers', () => {
    const appObjectsMock = {
        config: {
            scrapers: ['scraperA', 'scraperB'],
        },
        logger: {
            debug: stubFunction,
            info: stubFunction,
        },
    }

    describe('#find()', () => {
        it('should merge empty maps', done => {
            const createPageCallbacks = {
                scraperA: onCreatePageEmptyMock,
                scraperB: onCreatePageEmptyMock,
            }

            const scrapers = new Scrapers(appObjectsMock, createPageCallbacks)
            scrapers
                .find('hello')
                .then(results => assert.equal(results, ''))
                .then(done)
        })

        it('should sort by bot names', () => {})

        it('should ignore bots names case-sensitivity', () => {})

        it('should override previous descriptions', () => {})

        it('should trim description whitespace', () => {})

        it('should remove URLs from description', () => {})

        it('should remove @ from description', () => {})

        it('should remove new lines from description', () => {})
    })
})
