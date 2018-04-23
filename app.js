/**
 * Module dependencies.
 */
const bodyParser = require('body-parser');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const express = require('express');
const expressValidator = require('express-validator');
const favicon = require('serve-favicon');
const flash = require('express-flash');
const logger = require('morgan');
const lusca = require('lusca');
const passport = require('passport');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const errorHandler = require('./config/error-handler');

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.load({ path: '.env.dev' });

/**
 * API keys and Passport configuration.
 */
require('./config/passport');

/**
 * Load routes files
 */
const index = require('./routes/index');
const users = require('./routes/users');
const auth = require('./routes/auth');
const footer = require('./routes/footer');
const profile = require('./routes/profile');
const tags = require('./routes/tags');
const welcomer = require('./routes/welcomer');

/**
 * Create Express server.
 */
const app = express();

/**
 * Parse JSON
 */
bodyParser.json();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

/**
 * Express configuration.
 */
app.use(favicon(path.join(__dirname, 'public', 'favicon', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(compression());
app.use(expressValidator());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET,
  store: new MongoStore({
    url: process.env.MONGODB_URI || process.env.MONGOLAB_URI,
    autoReconnect: true
  })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use((req, res, next) => {
  // url with no csrf
  if (req.path === '/contact-us' ||
      req.path.includes('/search') ||
      req.path.includes('/login') ||
      req.path.match(/^(\/experience\/upload\/gallerypict\/)(\w)+/) ||
      req.path === '/profile/edit/cover-upload/add' ||
      req.path === '/profile/edit/profile-pic-upload/add') {
    next();
  } else {
    lusca.csrf()(req, res, next);
  }
});
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
app.use((req, res, next) => {
  res.locals.user = req.user;
  res.locals.recaptchaSiteKey = process.env.RECAPTCHA_SITE_KEY;
  res.locals.apiKeyMaps = process.env.API_KEY_MAPS;
  next();
});
app.use((req, res, next) => {
  // After successful login, redirect back to the intended page
  if (!req.user
      && req.path !== '/login'
      && req.path !== '/signup'
      && !req.path.match(/^\/auth/)
      && !req.path.match(/\./)) {
    req.session.returnTo = req.path;
  }
  next();
});

app.use('/', index);
app.use('/', footer);
app.use('/welcomer', welcomer);
app.use('/profile', profile);
app.use('/tags', tags);
app.use('/users', users);
app.use('/auth', auth);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  err.message = err.message;
  next(err);
});

app.use(errorHandler.logErrors);
app.use(errorHandler.clientErrorHandler);
app.use(errorHandler.errorHandler);

module.exports = app;
