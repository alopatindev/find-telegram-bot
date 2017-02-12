'use strict'

module.exports = function() {
    function htmlDecode(value) {
        return $("<div/>").html(value).text()
    }

    var result = []
    try {
        console.debug('storeBotBrowserScript')

        const botItems = $('.botitem').find('.info')
        const urls = botItems.find('a')
        const descriptions = botItems.find('.description')

        for (var i = 0; i < urls.length; i++) {
            const botName = urls[i]
                .href
                .replace('https://storebot.me/bot/', '') // FIXME

            const description = htmlDecode(descriptions[i].innerText.trim())

            result.push([botName, description])
        }

        console.debug('storeBotBrowserScript end')
    } catch (e) {
        console.error(e)
    }

    return result
}
