/*!
 * find-telegram-bot <https://github.com/alopatindev/find-telegram-bot>
 *
 * Copyright (c) 2017 Alexander Lopatin
 * Licensed under the MIT License
 */

'use strict'

const assert = require('assert')
const { createAppObjectsMock, logger } = require('./utils.js')

const Bot = require('../bot')

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
                    .catch(logger.error)

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
            logger.error(e)
        }

        resolve()
    }
}

function createScraperFacadeMock(resultsType) {
    let results = undefined

    if (resultsType === 'stub') {
        results = new Map()
    } else if (resultsType === 'mock') {
        results = new Map([
            ['bbot', 'second bot'],
            ['abot', 'first bot'],
            ['cbot', 'third bot'],
            ['zbot', 'last bot'],
        ])
    } else {
        throw new Error('No such ScraperFacade type')
    }

    return { find: _query => new Promise(resolve => resolve(results)) }
}

function testBotReply(resultsType, message, expectMessages, done, testClosure) { // FIXME: use Builder pattern?
    const appObjectsMock = createAppObjectsMock()

    const telegrafMock = new TelegrafMock(done, appObjectsMock)
    telegrafMock.expectMessages = expectMessages
    telegrafMock.testMessageReplyClosure = testClosure

    const scraperFacadeMock = createScraperFacadeMock(resultsType)

    const bot = new Bot(telegrafMock, scraperFacadeMock, appObjectsMock)
    bot.run()

    telegrafMock.simulateMessage(message)
}

describe('Bot', () => {
    it('should handle /start command', done => testBotReply('stub', '/start', 1, done, (messages, config) => {
        assert.strictEqual(messages[0], config.text.welcome)
    }))

    it('should handle empty string like /start command', done => testBotReply('stub', '', 1, done, (messages, config) => {
        assert.strictEqual(messages[0], config.text.welcome)
    }))

    it('should handle stub replies', done => testBotReply('stub', 'query', 1, done, (messages, config) => {
        const botsNumber = 0
        assert.strictEqual(messages[0], `${config.text.foundBots}${botsNumber}`)
    }))

    it('should sort, format and split output', done => testBotReply('mock', 'query', 3, done, (messages, config) => {
        const botsNumber = 4
        assert.strictEqual(messages[0], `${config.text.foundBots}${botsNumber}`)
        assert.strictEqual(messages[1], '@abot — first bot\n@bbot — second bot\n@cbot — third bot')
        assert.strictEqual(messages[2], '@zbot — last bot')
    }))
})
