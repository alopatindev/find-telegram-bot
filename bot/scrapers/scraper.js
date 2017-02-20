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

class PhantomUtils {
    constructor(page, instancePromise, logger) {
        this.page = page
        this.instancePromise = instancePromise
        this.logger = logger
    }

    openAndRun(url, scripts) {
        return this.page
            .open(url)
            .then(status => {
                assert.strictEqual(status, 'success', `Failed to load '${url}' status=${status}`)
                assert(scripts.length > 0, 'You need to provide a script')
                const results = scripts.map(script => this.page.evaluateJavaScript(script))
                const lastResult = results[results.length - 1]
                return lastResult
            })
    }

    exit(error) {
        const failed = error !== undefined

        if (failed) {
            this.logger.error(error)
        }

        this.instancePromise
            .then(instance => {
                // instance is phantom in phantom context
                const reason = failed ? ' due to failure' : ''
                const message = ['exit instance', reason].join('')
                this.logger.debug(message)
                instance.exit()
            })
            .catch(this.logger.error)
    }

    setOnCallback(callback) {
        this.page.on('onCallback', result => {
            try {
                callback(result)
            } catch (e) {
                this.logger.error(e)
            }
        })
    }
}

class Scraper {
    constructor(appObjects) {
        this.appObjects = appObjects
    }

    find(query) {
        const {
            logger,
        } = this.appObjects

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

                const phantomUtils = new PhantomUtils(page, instancePromise, logger)
                return this.onCreatePage(query, phantomUtils)
            })
            .catch(logger.error)
    }

    onCreatePage(_query, _phantomUtils) {
        throw new TypeError('Not implemented')
    }
}

module.exports = Scraper
