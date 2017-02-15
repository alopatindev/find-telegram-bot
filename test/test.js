'use strict'

const assert = require('assert')

const Scrapers = require('../scrapers')

describe('Scrapers', () => {
    const stubFunction = () => undefined
    const appObjectsMock = {
        config: {
            scrapers: ['scraperA', 'scraperB'],
        },
        logger: {
            debug: stubFunction,
            info: stubFunction,
        },
    }

    function onCreatePageEmptyMock(query, phantomObjects) {
        return new Promise(resolve => {
            phantomObjects
                .instancePromise
                .then(instance => instance.exit())
            resolve(new Map())
        })
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
