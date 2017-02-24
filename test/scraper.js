/*!
 * find-telegram-bot <https://github.com/alopatindev/find-telegram-bot>
 *
 * Copyright (c) 2017 Alexander Lopatin
 * Licensed under the MIT License
 */

'use strict'

const assert = require('assert')

const Scraper = require('../bot/scrapers/scraper.js')

class MockIncompleteScraper extends Scraper {}

describe('Incomplete Scraper', () => {
    it('should throw TypeError for incomplete scrapers', done => {
        const scraper = new MockIncompleteScraper()
        assert.throws(scraper._onCreatePage, TypeError)
        done()
    })
})
