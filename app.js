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
// const errorHandler = require('./config/error-handler');
const errorHandler = require('errorhandler');
const expressStatusMonitor = require('express-status-monitor');

const messagingController = require('./controllers/messaging');

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
const experience = require('./routes/experience');
const recommendation = require('./routes/recommendation');
const messaging = require('./routes/messaging');

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
app.use(expressStatusMonitor());
app.use(compression());
app.use(logger('dev'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET,
  cookie: { maxAge: 1209600000 }, // two weeks in milliseconds
  store: new MongoStore({
    url: process.env.MONGODB_URI || process.env.MONGOLAB_URI,
    autoReconnect: true
  })
}));
app.use(passport.initialize({
  userProperty: 'account'
}));
app.use(passport.session());
app.use(flash());
app.use((req, res, next) => {
  // url with no csrf
  if (req.path === '/profile/edit/cover-upload/add' ||
      req.path === '/profile/edit/profile-pic-upload/add' ||
      req.path === '/experience/create/cover-upload/add' ||
      req.path === '/experience/edit/cover-upload/add'
  ) {
    next();
  } else {
    lusca.csrf()(req, res, next);
  }
});
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.locals.account = req.account;
  res.locals.recaptchaSiteKey = process.env.RECAPTCHA_SITE_KEY;
  res.locals.googleApi = process.env.GOOGLE_API;
  res.locals.googleApiGeocode = process.env.GOOGLE_API_GEOCODE;

  if(req.account){
    // Get last 3 messages
    messagingController.getLastUpdateConversationsByUserIdAndNbLast(req.account._id, 3)
    .then((conversations) => {
      res.locals.headerConversations = conversations;

      const dateNow = new Date(Date.now());

      // Get last 5 notifications
      const notifications = [{
        reciver: res.locals.account,
        type: 'Bec-Welc',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur pellentesque porttitor finibus. Vestibulum commodo tempus erat placerat dapibus. Phasellus et mauris in justo molestie tristique sed at mi.',
        linkRedirect: '/',
        createdAt: dateNow,
        isNew: true,
        status: 'warning',
        title: 'title warning notif'
      },
      {
        reciver: res.locals.account,
        type: 'Exp-Ok',
        description: 'Nam turpis ipsum, tincidunt quis sagittis vel, viverra vel dui. Quisque in pulvinar sem, in suscipit ligula. Mauris eu ultrices magna. Aliquam erat volutpat. Duis sapien ante, placerat vitae hendrerit et, mattis sit amet turpis. Donec consequat efficitur quam et vehicula.',
        linkRedirect: '/',
        createdAt: dateNow,
        isNew: true,
        status: 'ok',
        title: 'title ok notif'
      },
      {
        reciver: res.locals.account,
        type: 'Exp-Shit',
        description: 'Maecenas eget ultrices tortor, nec ultrices ipsum. Nam condimentum porttitor tortor, vitae varius risus placerat vitae. Cras est lacus, bibendum vel congue nec, placerat ut lacus. Sed arcu felis, imperdiet sed lobortis vitae, tempor eget elit. Nulla ullamcorper sit amet ipsum quis molestie. Mauris nec odio turpis.',
        linkRedirect: '/',
        createdAt: dateNow,
        isNew: false,
        status: 'nok',
        title: 'title nok notif'
      }]

      res.locals.headerNotifications = notifications;

      next();
    })
  } else{
    next();
  }
});
app.use((req, res, next) => {
  // After successful login, redirect back to the intended page
  if (!req.account
      && req.path !== '/login'
      && req.path !== '/signup'
      && !req.path.match(/^\/auth/)
      && !req.path.match(/\./)) {
    req.session.returnTo = req.path;
  }
  next();
});
app.use(express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', 'favicon', 'favicon.ico')));

app.use('/', index);
app.use('/', footer);
app.use('/auth', auth);
app.use('/welcomer', welcomer);
app.use('/profile', profile);
app.use('/experience', experience);
app.use('/tags', tags);
app.use('/users', users);
app.use('/recommendation', recommendation);
app.use('/messaging', messaging);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  err.message = err.message;
  next(err);
});

/**
 * Error Handler.
 */
if (process.env.NODE_ENV === 'development') {
  // only use in development
  app.use(errorHandler());
}

// app.use(errorHandler.logErrors);
// app.use(errorHandler.clientErrorHandler);
// app.use(errorHandler.errorHandler);

module.exports = app;
