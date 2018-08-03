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
const errorHandler = require('errorhandler');
const expressStatusMonitor = require('express-status-monitor');
const fs = require('fs');

/**
 * Load controller
 */
const messagingController = require('./controllers/messaging');
const notificationController = require('./controllers/notification');
const notificationModel = require('./models/notifications');

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.load({ path: '.env.dev' });

/**
 * Create Express server.
 */
const app = express();

/**
 * Parse JSON
 */
bodyParser.json();

/**
 * View engine setup
 */
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

/**
 * @const noCSRFURL
 * @type {Set<String>}
 * @desc Do not check the CSRF of these URL 
 */
const noCSRFURL = new Set([
  '/profile/edit/cover-upload/add',
  '/profile/edit/profile-pic-upload/add',
  '/experience/create/cover-upload/add',
  '/experience/edit/cover-upload/add'
]);
app.use((req, res, next) => {
  if(noCSRFURL.has(req.path)){
    return next();
  }
  lusca.csrf()(req, res, next);
});

app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
app.disable('x-powered-by');

/**
 * @const noCheckPartUrl
 * @type {Array<String>}
 * @desc Do not retrieve conversations and notifications if the url contains one of these string
 */
const noCheckPartUrl = [
  '/images/',
  '/js/',
  '/css/',
  '/font/',
  '.jpg'
];

app.use(async (req, res, next) => {
  res.locals.account = req.account;
  res.locals.recaptchaSiteKey = process.env.RECAPTCHA_SITE_KEY;
  res.locals.googleApi = process.env.GOOGLE_API;
  res.locals.googleApiGeocode = process.env.GOOGLE_API_GEOCODE;

  if(!req.account || noCheckPartUrl.some(str => req.path.includes(str))) 
    return next();

  try{
    // Get last 3 messages
    res.locals.headerConversations = await messagingController.getLastUpdateConversationsByUserIdAndNbLast(req.account._id, 3);
    // Get last 3 notifications
    res.locals.headerNotifications = await notificationController.getNbLastNotificationsByUserId(req.account._id, 3);
    
    // // Test create Notifs
    // await notificationController.createNotification(notificationModel.NotificationTypes.Welcoming , req.account._id);
    // await notificationController.createNotification(notificationModel.NotificationTypes.NewWelcomer , req.account._id);

    next();
  }
  catch(err){
    next(err)
  }
});
app.use((req, res, next) => {
  // After successful login, redirect back to the intended page
  if (!req.account && req.path !== '/login' && req.path !== '/signup'
      && !req.path.match(/^\/auth/) && !req.path.match(/\./)) 
  {
    req.session.returnTo = req.path;
  }
  next();
});
app.use(express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', 'favicon', 'favicon.ico')));


/**
 * Autoload routes
 */
const routeDir = path.join(__dirname, 'routes');
fs.readdirSync(routeDir).forEach(function(file) {
  require(path.join(routeDir, file))(app);
});

/**
 * catch 404 and forward to error handler
 */
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

/**
 * Error Handler.
 */
if (process.env.NODE_ENV === 'development') {
  // only use in development
  app.use(errorHandler());
}

module.exports = app;
