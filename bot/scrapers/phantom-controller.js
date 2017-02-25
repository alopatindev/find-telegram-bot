/*!
 * find-telegram-bot <https://github.com/alopatindev/find-telegram-bot>
 *
 * Copyright (c) 2017 Alexander Lopatin
 * Licensed under the MIT License
 */

'use strict'

const assert = require('assert')

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

module.exports = PhantomController
