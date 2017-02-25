/*!
 * find-telegram-bot <https://github.com/alopatindev/find-telegram-bot>
 *
 * Copyright (c) 2017 Alexander Lopatin
 * Licensed under the MIT License
 */

'use strict'

module.exports = function() {
    function script() {
        const botUrlPrefix = this.baseUrl + '/bots/'

        const inputGroup = $('.input-group')
        const inputField = inputGroup.find('.form-control')

        inputField
            .val(this.query)
            .change()

        $('.jtable-page-info')
            .on('DOMSubtreeModified', function() {
                console.debug('computing results')

                const table = $('tr[class="jtable-data-row jtable-row-even"]')
                const urls = table
                    .find('small')
                    .find('a')

                const results = urls
                    .toArray()
                    .filter(function(url) {
                        return url.href.indexOf(botUrlPrefix) === 0
                    })
                    .map(function(url) {
                        const name = url
                            .href
                            .replace(botUrlPrefix, '')

                        const description = url.innerText

                        return [name, description]
                    })

                console.debug('tgramScript results.length=' + results.length)
                window.callPhantom(results) // runs onCallback
            })
    }

    try {
        console.debug('tgramScript')
        script()
        console.debug('tgramScript end')
    } catch (e) {
        console.error(e)
    }
}
