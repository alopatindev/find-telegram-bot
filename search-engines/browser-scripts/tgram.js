'use strict'

module.exports = function() {
    const botUrlPrefix = this.baseUrl + '/bots/'

    console.debug('botUrlPrefix=' + botUrlPrefix)
    console.debug('query=' + this.query)

    function script() {
        const inputGroup = $('.input-group')
        const inputField = inputGroup.find('.form-control')
        const submitButton = inputGroup.find('.input-group-btn')
        const pageSizeSelect = $('.jtable-page-size-change[select]')

        console.debug('inputGroup=' + inputGroup)
        console.debug('inputField=' + inputField)
        console.debug('submitButton=' + submitButton)
        console.debug('pageSizeSelect=' + pageSizeSelect)

        inputField.val(this.query)

        return []
    }

    var result = []

    try {
        console.debug('tgramBrowserScript')
        result = script()
        console.debug('tgramBrowserScript end')
    } catch (e) {
        console.error(e)
    }

    return result
}
