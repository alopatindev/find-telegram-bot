/*!
 * find-telegram-bot <https://github.com/alopatindev/find-telegram-bot>
 *
 * Copyright (c) 2017 Alexander Lopatin
 * Licensed under the MIT License
 */

'use strict'

const phantomjs = require('phantom')

const PhantomController = require('./phantom-controller.js')

const USER_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_0 like Mac OS X) AppleWebKit/602.1.38 (KHTML, like Gecko) Version/10.0 Mobile/14A5297c Safari/602.1'

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
