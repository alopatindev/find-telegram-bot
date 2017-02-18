/*!
 * find-telegram-bot <https://github.com/alopatindev/find-telegram-bot>
 *
 * Copyright (c) 2017 Alexander Lopatin
 * Licensed under the MIT License
 */

'use strict'

const assert = require('assert')

const Scrapers = require('../bot/scrapers')

function makeOnCreatePage(results) {
    const callback = (query, phantomObjects) => new Promise(resolve => {
        phantomObjects
            .instancePromise
            .then(instance => instance.exit())

        resolve(results)
    })

    return callback
}

const onCreatePageStub = makeOnCreatePage([])

const onCreatePageMockA = makeOnCreatePage([
    ['Dbot', 'Both name and description will be overriden'],
    ['Bbotty', 'Should not present in the output'],
    ['Cbot', 'Description will be overriden'],
    ['Abot', ' Whitespace and @spam https://eggs.foo\nftp://bar http://domain.com \t '],
    ['Ebot', ' \t\n '],
])

const onCreatePageMockB = makeOnCreatePage([
    ['Cbot', 'New description'],
    ['dbot', 'New name and description'],
    [' Fbot  ', 'Bot name will be trimmed'],
    ['G bot', 'Will be removed because of invalid name'],
    ['', 'Will be removed because of invalid name'],
])

const createPageCallbacksStub = {
    scraperA: onCreatePageStub,
    scraperB: onCreatePageStub,
}

const createPageCallbacksMock = {
    scraperA: onCreatePageMockA,
    scraperB: onCreatePageMockB,
}

const stubFunction = () => undefined

function testScrapers(createPageCallbacks, done, testClosure) {
    const appObjectsMock = {
        config: {
            message: {
                descriptionMaxLength: 100,
                maxLines: 30,
            },
            scrapers: ['scraperA', 'scraperB'],
        },

        logger: {
            debug: stubFunction,
            info: stubFunction,
        },
    }

    const scrapers = new Scrapers(appObjectsMock, createPageCallbacks)
    scrapers
        .find('query')
        .then(testClosure)
        .then(done)
}

describe('Scrapers', () => {
    describe('#find()', () => {
        it('should merge empty results', done => testScrapers(createPageCallbacksStub, done, results => {
            assert(Array.isArray(results))
            assert.strictEqual(results.length, 0)
        }))

        it('should override previous descriptions', done => testScrapers(createPageCallbacksMock, done, results => {
            assert(Array.isArray(results))

            const hasOldDescriptions =
                results.includes('@cbot — Description will be overriden') ||
                results.includes('@dbot — Both name and description will be overriden')

            const hasNewDescriptions =
                results.includes('@cbot — New description') &&
                results.includes('@dbot — New name and description')

            assert(!hasOldDescriptions)
            assert(hasNewDescriptions)
        }))

        it('should have case-insensitive bot names', done => testScrapers(createPageCallbacksMock, done, results => {
            assert(Array.isArray(results))

            const hasOldNames = results
                .filter(line => line.startsWith('@Dbot'))
                .length > 0

            const hasNewName = results
                .filter(line => line.startsWith('@dbot'))
                .length === 1

            assert(!hasOldNames)
            assert(hasNewName)
        }))

        it('should contain only bot names with postfix "bot"', done => testScrapers(createPageCallbacksMock, done, results => {
            assert(Array.isArray(results))

            const nameHasPostfixBot = results
                .filter(line => /^@.*bot — .*$/.test(line))
                .length === results.length

            assert(nameHasPostfixBot)
        }))

        it('should trim description whitespace', done => testScrapers(createPageCallbacksMock, done, results => {
            assert(Array.isArray(results))

            const hasWhitespace = results
                .filter(line =>
                    line.startsWith(' ') ||
                    line.endsWith(' ') ||
                    line.startsWith('\t') ||
                    line.endsWith('\t'))
                .length > 0

            assert(!hasWhitespace)
        }))

        it('should remove URLs from description', done => testScrapers(createPageCallbacksMock, done, results => {
            assert(Array.isArray(results))

            const hasUrls = results
                .filter(line =>
                    line.includes('https://') ||
                    line.includes('http://') ||
                    line.includes('ftp://'))
                .length > 0

            assert(!hasUrls)
        }))

        it('should remove @ from description', done => testScrapers(createPageCallbacksMock, done, results => {
            assert(Array.isArray(results))

            const hasAtChar = results
                .filter(line => line
                    .slice(1)
                    .includes('@'))
                .length > 0

            assert(!hasAtChar)
        }))

        it('should remove new lines from description', done => testScrapers(createPageCallbacksMock, done, results => {
            assert(Array.isArray(results))

            const hasNewLines = results
                .filter(line => line.includes('\n'))
                .length > 0

            assert(!hasNewLines)
        }))

        it('should contain non-empty bot names', done => testScrapers(createPageCallbacksMock, done, results => {
            assert(Array.isArray(results))

            const hasEmptyNames = results
                .filter(line => /^@ —/.test(line))
                .length > 0

            assert(!hasEmptyNames)
        }))

        it('should contain non-empty descriptions', done => testScrapers(createPageCallbacksMock, done, results => {
            assert(Array.isArray(results))

            const hasEmptyDescriptions = results
                .filter(line => /— $/.test(line))
                .length > 0

            assert(!hasEmptyDescriptions)
        }))

        it('should trim bot names', done => testScrapers(createPageCallbacksMock, done, results => {
            assert(Array.isArray(results))

            const hasNamesWithWhitespace = results
                .filter(line =>
                    line.startsWith('@ ') ||
                    line.startsWith('@\t') ||
                    line.includes('  —') ||
                    line.includes('\t —'))
                .length === results.length

            assert(!hasNamesWithWhitespace)
        }))

        it('should sort by bot names', done => testScrapers(createPageCallbacksMock, done, results => {
            assert(Array.isArray(results))

            const names = results.map(line => line.match(/@(.*) —/)[1])
            const expect = ['abot', 'cbot', 'dbot', 'fbot']

            assert.deepStrictEqual(names, expect)
        }))
    })
})
