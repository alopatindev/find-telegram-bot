/*!
 * find-telegram-bot <https://github.com/alopatindev/find-telegram-bot>
 *
 * Copyright (c) 2017 Alexander Lopatin
 * Licensed under the MIT License
 */

'use strict'

const assert = require('assert')
const phantomjs = require('phantom')

const USER_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_0 like Mac OS X) AppleWebKit/602.1.38 (KHTML, like Gecko) Version/10.0 Mobile/14A5297c Safari/602.1'

class PhantomController {
    constructor(page, instancePromise, logger) {
        this._page = page
        this._instancePromise = instancePromise
        this._logger = logger
    }

    openAndRun(url, scripts) {
        return this._page
            .open(url)
            .then(status => {
                assert.strictEqual(status, 'success', `Failed to load '${url}' status=${status}`)
                assert(scripts.length > 0, 'You need to provide a script')
                const results = scripts.map(script => this._page.evaluateJavaScript(script))
                const lastResult = results[results.length - 1]
                return lastResult
            })
    }

    exit(error) {
        const failed = error !== undefined

        if (failed) {
            this._logger.error(error)
        }

        this._instancePromise
            .then(instance => {
                // instance is phantom in phantom context
                const reason = failed ? ' due to failure' : ''
                const message = ['exit instance', reason].join('')
                this._logger.debug(message)
                return instance.exit()
            })
            .catch(this._logger.error)
    }

    setOnCallback(callback) {
        this._page.on('onCallback', result => {
            try {
                callback(result)
            } catch (e) {
                this._logger.error(e)
            }
        })
    }
}

class Scraper {
    constructor(appObjects) {
        this._appObjects = appObjects
    }

    find(query) {
        const { logger } = this._appObjects

        const instancePromise = phantomjs
            .create([
                '--load-images=no',
                '--ignore-ssl-errors=true',
                //'--debug=true',
            ], {
                //logger,
            })
            .catch(logger.error)

        const pagePromise = instancePromise
            .then(instance => instance.createPage())
            .catch(logger.error)

        return pagePromise
            .then(page => {
                page.setting('userAgent', USER_AGENT)
                page.on('onConsoleMessage', logger.debug)

                const phantomController = new PhantomController(page, instancePromise, logger)
                const createPagePromise = this._onCreatePage(query, phantomController)
                return createPagePromise
            })
            .catch(logger.error)
    }

    _onCreatePage(_query, _phantomController) {
        throw new TypeError('Not implemented')
    }
}

module.exports = Scraper
