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
const sassMiddleware = require('node-sass-middleware');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.load({ path: '.env.dev' });

/**
 * Load routes files
 */
const index = require('./routes/index');
const users = require('./routes/users');

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
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(sassMiddleware({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  indentedSyntax: true, // true = .sass and false = .scss
  sourceMap: true
}));
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
  if (req.path === '/account/set_profile/upload/profilePict' ||
      req.path === '/account/set_profile/upload/profileCover' ||
      req.path === '/contact-us' ||
      req.path.includes('/search') ||
      req.path.includes('/login') ||
      req.path.match(/^(\/experience\/upload\/gallerypict\/)(\w)+/) ||
      req.path === '/experience/upload/gallerypict') {
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
app.use('/users', users);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  console.log(req.app.get('env'));
  next(err);
});

// error handler
app.use((err, req, res) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
