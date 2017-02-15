/*!
 * find-telegram-bot <https://github.com/alopatindev/find-telegram-bot>
 *
 * Copyright (c) 2017 Alexander Lopatin
 * Licensed under the MIT License
 */

'use strict'

const assert = require('assert')

const Scrapers = require('../scrapers')

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
])

const onCreatePageMockB = makeOnCreatePage([
    ['Cbot', 'New description'],
    ['dbot', 'New name and description'],
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
            assert.ok(Array.isArray(results))
            assert.strictEqual(results.length, 0)
        }))

        it('should override previous descriptions', done => testScrapers(createPageCallbacksMock, done, results => {
            assert.ok(Array.isArray(results))

            const hasOldDescriptions =
                results.includes('@cbot — Description will be overriden') ||
                results.includes('@dbot — Both name and description will be overriden')

            const hasNewDescriptions =
                results.includes('@cbot — New description') &&
                results.includes('@dbot — New name and description')

            assert.ok(!hasOldDescriptions)
            assert.ok(hasNewDescriptions)
        }))

        it('should have case-insensitive bot names', done => testScrapers(createPageCallbacksMock, done, results => {
            assert.ok(Array.isArray(results))

            const hasOldNames = results
                .filter(line => line.startsWith('@Dbot'))
                .length > 0

            const hasNewName = results
                .filter(line => line.startsWith('@dbot'))
                .length === 1

            assert.ok(!hasOldNames)
            assert.ok(hasNewName)
        }))

        it('should contain only bot names with postfix "bot"', done => testScrapers(createPageCallbacksMock, done, results => {
            assert.ok(Array.isArray(results))

            const nameHasPostfixBot = results
                .filter(line => /^@.*bot — .*$/.test(line))
                .length === results.length

            assert.ok(nameHasPostfixBot)
        }))

        it('should trim description whitespace', done => testScrapers(createPageCallbacksMock, done, results => {
            assert.ok(Array.isArray(results))

            const hasWhitespace = results
                .filter(line =>
                    line.startsWith(' ') ||
                    line.endsWith(' ') ||
                    line.startsWith('\t') ||
                    line.endsWith('\t'))
                .length > 0

            assert.ok(!hasWhitespace)
        }))

        it('should remove URLs from description', done => testScrapers(createPageCallbacksMock, done, results => {
            assert.ok(Array.isArray(results))

            const hasUrls = results
                .filter(line =>
                    line.includes('https://') ||
                    line.includes('http://') ||
                    line.includes('ftp://'))
                .length > 0

            assert.ok(!hasUrls)
        }))

        it('should remove @ from description', done => testScrapers(createPageCallbacksMock, done, results => {
            assert.ok(Array.isArray(results))

            const hasAtChar = results
                .filter(line => line
                    .slice(1)
                    .includes('@'))
                .length > 0

            assert.ok(!hasAtChar)
        }))

        it('should remove new lines from description', done => testScrapers(createPageCallbacksMock, done, results => {
            assert.ok(Array.isArray(results))

            const hasNewLines = results
                .filter(line => line
                    .includes('\n'))
                .length > 0

            assert.ok(!hasNewLines)
        }))

        it('should sort by bot names', done => testScrapers(createPageCallbacksMock, done, results => {
            assert.ok(Array.isArray(results))

            const botNames = results
                .map(line => line.match(/@(.*) —/)[1])

            const expect = ['abot', 'cbot', 'dbot']

            assert.deepStrictEqual(botNames, expect)
        }))
    })
})
