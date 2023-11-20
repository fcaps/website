const appConfig = require('./config/app')
const middleware = require("./routes/middleware");
const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const passport = require("passport");
const flash = require("connect-flash");
const mainController = require('./mainController');

//Execute Middleware
router.use(middleware.initLocals);
router.use(middleware.clientChecks);

//Set static public directory path
router.use(express.static('public', {
    immutable: true,
    maxAge: 4 * 60 * 60 * 1000 // 4 hours
}));


router.use(express.json());
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: false}));
router.use(cookieParser());

// Session determines how long will the user be logged in/authorized in the website
router.use(session({
    secret: appConfig.session.key,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: appConfig.session.tokenLifespan * 1000
    }
}));

router.use(passport.initialize());
router.use(passport.session());
router.use(flash());
router.use(middleware.username);
router.use(middleware.flashMessage);
router.use(middleware.copyFlashMessagesToLocals);

module.exports = (app) => {
    app.locals.clanInvitations = {};
    app.set('views', 'templates/views');
    app.set('view engine', 'pug');
    app.set('port', appConfig.expressPort);

    app.use(router)
    app.use('/', mainController)
}
