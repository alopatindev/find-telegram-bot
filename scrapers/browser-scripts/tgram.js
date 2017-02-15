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

                const result = urls
                    .toArray()
                    .filter(function(url) {
                        return url.href.indexOf(botUrlPrefix) === 0
                    })
                    .map(function(url) {
                        const botName = url
                            .href
                            .replace(botUrlPrefix, '')
                        const description = url.innerText
                        return [botName, description]
                    })

                window.callPhantom(result) // runs onCallback
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
