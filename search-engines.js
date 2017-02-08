'use strict'

class SearchEngines {
    constructor(logger) {
        this.logger = logger
    }

    run(query) {
        return new Promise((resolve, reject) => {
            this.logger.debug(`running query ${query}`)
            resolve(`result of ${query}`)
        })
    }
}

module.exports = SearchEngines
