const express = require("express")
const router = express.Router()
const newsRouter = require('./routes/views/news')
const authRouter = require('./routes/views/auth')


router.use('/news', newsRouter)
router.use('/', authRouter)

module.exports = router
