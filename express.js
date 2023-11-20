const appConfig = require('./config/app')
const express = require('express');
const showdown = require('showdown');
const fs = require('fs');
const middleware = require('./routes/middleware');
const app = express();
const bootstrap = require('./bootstrap');



// --- R O U T E S ---
// when the website is asked to render "/pageName" it will come here and see what are the "instructions" to render said page. If the page isn't here, then the website won't render it properly.

bootstrap(app)

// --- UNPROTECTED ROUTES ---
const appGetRouteArray = [
  // This first '' is the home/index page
  '', 'newshub', 'campaign-missions', 'scfa-vs-faf', 'donation', 'tutorials-guides', 'ai', 'patchnotes', 'faf-teams', 'contribution', 'content-creators', 'tournaments', 'training', 'leaderboards', 'play', 'clans',];

//Renders every page written above
appGetRouteArray.forEach(page => app.get(`/${page}`, (req, res) => {
  // disabled due https://github.com/FAForever/website/issues/445
  if (['leaderboards', 'clans'].includes(page)) {
    return res.status(503).render('errors/503-known-issue')
  }
  res.render(page);
}));

/*
// List of route name changes
 reset > requestPasswordReset
 confirmReset > confirmPasswordReset
 change > changePassword, changeUsername, changeEmail
 */

// Account routes
// These routes are protected by the 'middleware.isAuthenticated' function (which verifies if user is serialized/deserialized or logged in [same thing]).
const accountRoutePath = './routes/views/account';
const protectedAccountRoutes = [
  'linkGog', 'report', 'changePassword', 'changeEmail', 'changeUsername',];

protectedAccountRoutes.forEach(page => app.post(`/account/${page}`, middleware.isAuthenticated, require(`${accountRoutePath}/post/${page}`)));

protectedAccountRoutes.forEach(page => app.get(`/account/${page}`, middleware.isAuthenticated, require(`${accountRoutePath}/get/${page}`)));


//Password reset routes
const passwordResetRoutes = ['requestPasswordReset', 'confirmPasswordReset'];

passwordResetRoutes.forEach(page => app.post(`/account/${page}`, require(`${accountRoutePath}/post/${page}`)));
passwordResetRoutes.forEach(page => app.get(`/account/${page}`, require(`${accountRoutePath}/get/${page}`)));

app.get('/account/password/confirmReset', require(`${accountRoutePath}/get/confirmPasswordReset`));
app.post('/account/password/confirmReset', require(`${accountRoutePath}/post/confirmPasswordReset`));

//legacy password reset path for backwards compatibility
app.get('/account/password/reset', require(`${accountRoutePath}/get/requestPasswordReset`));
app.post('/account/password/reset', require(`${accountRoutePath}/post/requestPasswordReset`));


// --- C L A N S ---
const routes = './routes/views/';

const clansRoutesGet = [
  'create', 'manage', 'accept_invite',];
// disabled due https://github.com/FAForever/website/issues/445
// clansRoutesGet.forEach(page => app.get(`/clans/${page}`, middleware.isAuthenticated, require(`${routes}clans/get/${page}`)));
clansRoutesGet.forEach(page => app.get(`/clans/${page}`, middleware.isAuthenticated, (req, res) =>  res.status(503).render('errors/503-known-issue')));

const clansRoutesPost = [
  'create', 'destroy', 'invite', 'kick', 'transfer', 'update', 'leave', 'join',];
// disabled due https://github.com/FAForever/website/issues/445
// clansRoutesPost.forEach(page => app.post(`/clans/${page}`, middleware.isAuthenticated, require(`${routes}clans/post/${page}`)));
clansRoutesPost.forEach(page => app.post(`/clans/${page}`, middleware.isAuthenticated,  (req, res) =>  res.status(503).render('errors/503-known-issue')));


// disabled due https://github.com/FAForever/website/issues/445
//When searching for a specific clan
// app.get('/clans/*', (req, res) => {
//   res.render(`clans/seeClan`);
// });
app.get('/clans/*',  (req, res) =>  res.status(503).render('errors/503-known-issue'));


// Markdown Routes

// ToS and Privacy Statement
function markdown(template) {
  let html = new showdown.Converter().makeHtml(fs.readFileSync(template, 'utf-8'));
  return (req, res) => {
    res.render('markdown', {content: html});
  };
}

app.get('/privacy', markdown('templates/views/markdown/privacy.md'));
app.get('/privacy-fr', markdown('templates/views/markdown/privacy-fr.md'));
app.get('/privacy-ru', markdown('templates/views/markdown/privacy-ru.md'));
app.get('/tos', markdown('templates/views/markdown/tos.md'));
app.get('/tos-fr', markdown('templates/views/markdown/tos-fr.md'));
app.get('/tos-ru', markdown('templates/views/markdown/tos-ru.md'));
app.get('/rules', markdown('templates/views/markdown/rules.md'));
app.get('/cg', markdown('templates/views/markdown/cg.md'));


// ---ODD BALLS---
// Routes that might not be able to be added into the loops due to their nature in naming
/* Removed
  client.js (was made its own code below)
  lobby_api (not in use in the new website)
 */
// Protected

app.get('/account/link', middleware.isAuthenticated, require(routes + 'account/get/linkSteam'));
//app.get('/account/linkSteam', middleware.isAuthenticated, require(routes + 'account/get/linkSteam'));
app.get('/account/connect', middleware.isAuthenticated, require(routes + 'account/get/connectSteam'));
//app.get('/account/connectSteam', middleware.isAuthenticated, require(routes + 'account/get/connectSteam'));
app.get('/account/resync', middleware.isAuthenticated, require(routes + 'account/get/resync'));
// Not Protected
app.get('/account/create', require(routes + 'account/get/createAccount'));
app.get('/account_activated', require(routes + 'account/get/register'));
app.get('/account/register', require(routes + 'account/get/register'));
app.post('/account/register', require(routes + 'account/post/register'));

app.get('/account/activate', require(routes + 'account/get/activate'));
app.post('/account/activate', require(routes + 'account/post/activate'));

app.get('/account/checkUsername', require('./routes/views/checkUsername'));
app.get('/password_resetted', require(routes + 'account/get/requestPasswordReset'));
app.get('/report_submitted', require(routes + 'account/get/report'));

// Run scripts initially on startup
let requireRunArray = ['extractor'];
for (let i = 0; i < requireRunArray.length; i++) {
  try {
    require(`./scripts/${requireRunArray[i]}`).run();
  } catch (e) {
    console.error(`Error running ${requireRunArray[i]} script. Make sure the API is available (will try again after interval).`, e);
  }
// Interval for scripts
  setInterval(() => {
    try {
      require(`./scripts/${requireRunArray[i]}`).run();
    } catch (e) {
      console.error(`${requireRunArray[i]} caused the error`, e);
    }
  }, appConfig.extractorInterval * 60 * 1000); 
}
setInterval(() => {
  try {
    require(`./scripts/getRecentUsers`).run();

  } catch (e) {
    console.error(`getRecentUsers script caused the error`, e);
  }
}, appConfig.playerCountInterval * 1000); 


//404 Error Handlers
app.use(function (req, res) {
  res.status(404).render('errors/404');
});
app.use(function (err, req, res, next) {
  console.error('[error] Incoming request to"', req.originalUrl, '"failed with error "', err.toString(), '"')
  if (res.headersSent) {
    return next(err);
  }

  res.status(500).render('errors/500');
});

app.listen(appConfig.expressPort, () => {
    console.log(`Express listening on port ${appConfig.expressPort}`);
});
