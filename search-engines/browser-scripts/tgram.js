'use strict'

function tgramSearchScript() {
    const botUrlPrefix = this.baseUrl + '/bots/'

    function script() {
        const inputGroup = $('.input-group')
        const inputField = inputGroup.find('.form-control')
        const submitButton = inputGroup.find('.input-group-btn')

        inputField.val(this.query)
        submitButton.click()
    }

    var result = []

    try {
        console.debug('tgramSearchScript')
        script()
        console.debug('tgramSearchScript end')
    } catch (e) {
        console.error(e)
    }
}

function tgramExpandPageScript() {
    const botUrlPrefix = this.baseUrl + '/bots/'

    console.debug('botUrlPrefix=' + botUrlPrefix)

    function script() {
        const pageSizeSelect = $('.jtable-page-size-change[select]')
        console.debug('pageSizeSelect=' + pageSizeSelect)
        return []
    }

    var result = []

    try {
        console.debug('tgramExpandPageScript')
        result = script()
        console.debug('tgramExpandPageScript end')
    } catch (e) {
        console.error(e)
    }

    return result
}

module.exports = {
    tgramSearchScript: tgramSearchScript,
    tgramExpandPageScript: tgramExpandPageScript,
}
