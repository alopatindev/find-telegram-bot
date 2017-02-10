'use strict'

module.exports = function() {
    const MAX_DESCRIPTION_LENGTH = 40

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
            const description = descriptions[i]
                .innerText
                .trim()
                .replace(/[@\n]/g, '')
                .slice(0, MAX_DESCRIPTION_LENGTH)
            result.push([botName, description])
        }

        console.debug('storeBotBrowserScript end')
    } catch (e) {
        console.error(e)
    }

    return result
}
