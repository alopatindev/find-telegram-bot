'use strict'

module.exports = function() {
    const BOT_URL_PREFIX = 'https://storebot.me/bot/'

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
                    .replace(BOT_URL_PREFIX, '')
                const description = htmlDecode(descriptions[index].innerText.trim())
                return [botName, description]
            })
    }

    var result = []

    try {
        console.debug('storeBotBrowserScript')
        result = script()
        console.debug('storeBotBrowserScript end')
    } catch (e) {
        console.error(e)
    }

    return result
}
