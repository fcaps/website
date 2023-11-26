const request = require('request')
const error = require('../post/error')

exports = module.exports = function (req, res) {
    const locals = res.locals

    // locals.section is used to set the currently selected
    // item in the header navigation.
    locals.section = 'account'

    locals.formData = req.body || {}

    const flash = {}

    const overallRes = res

    request.post({
        url: process.env.API_URL + '/users/buildSteamPasswordResetUrl'
    }, function (err, res, body) {
        if (err || res.statusCode !== 200) {
            console.error(err)
            if (res) {
                error.parseApiErrors(body, flash)
            } else {
                flash.class = 'alert-danger'
                flash.messages = err
                flash.type = 'Error!'
            }
            overallRes.render('account/requestPasswordReset', { flash, recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY })
            return
        }

        locals.steamReset = JSON.parse(body).steamUrl
        overallRes.render('account/requestPasswordReset', { flash, recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY })
    }
    )
}
