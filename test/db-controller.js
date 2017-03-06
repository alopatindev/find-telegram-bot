/*!
 * find-telegram-bot <https://github.com/alopatindev/find-telegram-bot>
 *
 * Copyright (c) 2017 Alexander Lopatin
 * Licensed under the MIT License
 */

'use strict'

const assert = require('assert')
const MongoClientMock = require('mongo-mock').MongoClient

const DbController = require('../bot/db-controller.js')

describe('DbController', () => {
    describe('disconnect', () => {
        it.skip('should close db connection', () => {})
    })

    describe('findBots returns a cursor to bots', () => {
        it.skip('should sort by name', () => {})

        it.skip('should contain lowercase names', () => {})

        it.skip('should not contain "bot" postfix', () => {})
    })

    describe('addBots', () => {
        it.skip('should add a new bot', () => {})
    })

    describe('addScraperQuery', () => {
        it.skip('should add a new scraperQuery', () => {})

        it.skip('should add expirable scraperQuery', () => {})
    })

    describe('isScrapedRecently', () => {
        it.skip('should check if scraperQuery exists', () => {})
    })
})
