/*!
 * find-telegram-bot <https://github.com/alopatindev/find-telegram-bot>
 *
 * Copyright (c) 2017 Alexander Lopatin
 * Licensed under the MIT License
 */

'use strict'

const assert = require('assert')
const { createAppObjectsMock } = require('./utils.js')

const Bot = require('../bot')
const chars = require('../bot/chars.json')

class TelegrafMock {
    constructor(done, appObjects) {
        this._done = done
        this._appObjects = appObjects

        this._expectMessages = 1
        this._testMessageReplyClosure = () => {}

        this._messages = []
        this._polling = false

        this._onCallbacks = {}
        this._commandCallbacks = {}
    }

    command(trigger, middleware) {
        this._commandCallbacks[trigger] = middleware
    }

    on(updateType, middleware) {
        this._onCallbacks[updateType] = middleware
    }

    simulateMessage(query) {
        const ctx = this._createCtxMock(query)

        if (query.startsWith('/')) {
            const command = query.replace(/^\//, '')
            this._commandCallbacks[command](ctx)
        } else {
            this._onCallbacks.message(ctx)
        }
    }

    set expectMessages(number) {
        this._expectMessages = number
    }

    set testMessageReplyClosure(closure) {
        this._testMessageReplyClosure = closure
    }

    get polling() {
        return this._polling
    }

    startPolling() {
        this._polling = true
    }

    _createCtxMock(query) {
        const self = this

        return {
            from: { id: 1, username: 'user' },
            message: { text: query },
            reply: text => {
                assert(self.polling)

                const promiseResult = new Promise(resolve => self.onReply(text, resolve))
                    .catch(self._done)

                return promiseResult
            },
        }
    }

    onReply(text, resolve) {
        this._messages.push(text)

        try {
            if (this._messages.length >= this._expectMessages) {
                this._testMessageReplyClosure(this._messages, this._appObjects.config)
                this._done()
            }
        } catch (e) {
            this._done(e)
        }

        resolve()
    }
}

class ScraperFacadeMock {
    static create(resultsType) {
        const scraperResults = new Map()

        scraperResults.set('stub', new Map())
        scraperResults.set('mock', new Map([
            ['bbot', 'second bot'],
            ['abot', 'first bot'],
            ['cbot', 'third bot'],
            ['zbot', 'last bot'],
        ]))

        assert(scraperResults.has(resultsType), `Unknown scraper results ${resultsType}`)
        const results = scraperResults.get(resultsType)

        return new ScraperFacadeMock(results)
    }

    constructor(results) {
        this._results = results
    }

    find(_query) {
        return new Promise(resolve => resolve(this._results))
    }
}

class BotReplyMock {
    simulateMessage(message) {
        this._message = message
        return this
    }

    receiveResults(resultsType) {
        this._resultsType = resultsType
        return this
    }

    expectResultMessages(expectMessages) {
        this._expectMessages = expectMessages
        return this
    }

    verify(done, testClosure) {
        const appObjectsMock = createAppObjectsMock()

        const telegrafMock = new TelegrafMock(done, appObjectsMock)
        telegrafMock.expectMessages = this._expectMessages
        telegrafMock.testMessageReplyClosure = testClosure

        const scraperFacadeMock = ScraperFacadeMock.create(this._resultsType)

        const bot = new Bot(telegrafMock, scraperFacadeMock, appObjectsMock)
        bot.run()

        telegrafMock.simulateMessage(this._message)
    }
}

describe('Bot', () => {
    it('should handle /start command', done => new BotReplyMock()
        .simulateMessage('/start')
        .receiveResults('stub')
        .expectResultMessages(1)
        .verify(done, (messages, config) => {
            assert.strictEqual(messages[0], config.text.welcome)
        }))

    it('should handle empty string as /start command', done => new BotReplyMock()
        .simulateMessage('')
        .receiveResults('stub')
        .expectResultMessages(1)
        .verify(done, (messages, config) => {
            assert.strictEqual(messages[0], config.text.welcome)
        }))

    it('should handle stub replies', done => new BotReplyMock()
        .simulateMessage('query')
        .receiveResults('stub')
        .expectResultMessages(1)
        .verify(done, (messages, config) => {
            const botsNumber = 0
            assert.strictEqual(messages[0], `${config.text.foundBots}${botsNumber}`)
        }))

    it('should sort, format and split output', done => new BotReplyMock()
        .simulateMessage('query')
        .receiveResults('mock')
        .expectResultMessages(3)
        .verify(done, (messages, config) => {
            const botsNumber = 4
            assert.strictEqual(messages[0], `${config.text.foundBots}${botsNumber}`)
            assert.strictEqual(messages[1], `@abot ${chars.em_dash} first bot\n@bbot ${chars.em_dash} second bot\n@cbot ${chars.em_dash} third bot`)
            assert.strictEqual(messages[2], `@zbot ${chars.em_dash} last bot`)
        }))
})
