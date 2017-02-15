'use strict'

module.exports = function() {
    const botUrlPrefix = this.baseUrl + '/bot/'

    function htmlDecode(value) {
        return $('<div/>')
            .html(value)
            .text()
    }

    function script() {
        const botItems = $('.botitem').find('.info')
        const urls = botItems.find('a')
        const descriptions = botItems.find('.description')

        return urls
            .toArray()
            .map(function(url, index) {
                const botName = url
                    .href
                    .replace(botUrlPrefix, '')

                const description = htmlDecode(descriptions[index]
                    .innerText
                    .trim())

                return [botName, description]
            })
    }

    var result = []

    try {
        console.debug('storebotScript')
        result = script()
        console.debug('storebotScript end')
    } catch (e) {
        console.error(e)
    }

    return result
}
