const passport = require('passport');
const { Strategy: LocalStrategy } = require('passport-local');
const { Strategy: FacebookStrategy } = require('passport-facebook');
const { Strategy: TwitterStrategy } = require('passport-twitter');
const { OAuth2Strategy: GoogleStrategy } = require('passport-google-oauth');

const User = require('../models/users');
const Interest = require('../models/interests');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findOne({ _id: id, isActive: true }, (err, user) => {
    done(err, user);
  }).populate({ path: 'profile.interests', select: 'name _id', model: Interest });
});

/**
 * Sign in using Email and Password.
 */
passport.use(new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
  User.findOne({ email: email.toLowerCase() }, (err, user) => {
    if(err) { return done(err); }
    if (!user) {
      return done(null, false, { msg: `Email ${email} not found.` });
    }
    user.comparePassword(password, (err, isMatch) => {
      if(err) { return done(err); }
      if (isMatch) {
        return done(null, user);
      }
      return done(null, false, { msg: 'Invalid email or password.' });
    });
  });
}));

/**
 * OAuth Strategy Overview
 *
 * - User is already logged in.
 *   - Check if there is an existing account with a provider id.
 *     - If there is, return an error message. (Account merging not supported)
 *     - Else link new OAuth account with currently logged-in user.
 * - User is not logged in.
 *   - Check if it's a returning user.
 *     - If returning user, sign in and we are done.
 *     - Else check if there is an existing account with user's email.
 *       - If there is, return an error message.
 *       - Else create a new account.
 */

/**
 * Sign in with Facebook.
 */
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_ID,
  clientSecret: process.env.FACEBOOK_SECRET,
  callbackURL: '/auth/facebook/callback',
  profileFields: ['email', 'link', 'birthday', 'gender', 'location', 'first_name', 'last_name', 'picture'],
  passReqToCallback: true
}, (req, accessToken, refreshToken, profile, done) => {
  if (req.account) {
    User.findOne({ $or: [{ facebook: profile.id }, { email: profile._json.email}]}, (err, existingUser) => {
      if (err) { return done(err); }
      if (existingUser) {
        req.flash('errors', { msg: 'There is already a Facebook account that belongs to you. Sign in with that account or delete it.' });
        done(err);
      } else {
        User.findById(req.account.id, (err, user) => {
          if (err) { return done(err); }

          user.facebook = profile.id;
          user.tokens.push({ kind: 'facebook', accessToken });

          user.email = profile._json.email;
          user.profile.facebookLink = profile._json.link;
          user.profile.firstName = profile._json.first_name;
          user.profile.lastName = profile._json.last_name;
          if(profile._json.gender && profile._json.gender === 'male'){
            user.profile.gender = 'man';
          } else if(profile._json.gender && profile._json.gender === 'female'){
            user.profile.gender = 'woman';
          }
          if(profile._json.location){
            user.profile.city = profile._json.location.name
          }
          if (profile._json.picture && profile._json.picture.data){
            user.profile.profilePic = {
              picture: `https://graph.facebook.com/${profile.id}/picture?type=large`
            }
          }

          user.save((err) => {
            req.flash('info', { msg: 'Facebook account has been linked.' });
            done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({ facebook: profile.id }, (err, existingUser) => {
      if (err) { return done(err); }
      if (existingUser) {
        return done(null, existingUser);
      }  else{
        User.findOne({ email: profile._json.email }, (err, existingEmailUser) => {
          if (err) { return done(err); }
          if (existingEmailUser) {
            req.flash('errors', { msg: 'There is already an account using this email address.' });
            done(err);
          } else {
            const user = new User();
            
            user.facebook = profile.id;
            user.tokens.push({ kind: 'facebook', accessToken });
  
            user.email = profile._json.email;
            user.profile.facebookLink = profile._json.link;
            user.profile.firstName = profile._json.first_name;
            user.profile.lastName = profile._json.last_name;
            if(profile._json.gender && profile._json.gender === 'male'){
              user.profile.gender = 'man';
            } else if(profile._json.gender && profile._json.gender === 'female'){
              user.profile.gender = 'woman';
            }
            if(profile._json.location){
              user.profile.city = profile._json.location.name
            }
            if (profile._json.picture && profile._json.picture.data){
              user.profile.profilePic = {
                picture: `https://graph.facebook.com/${profile.id}/picture?type=large`
              }
            }
  
            user.save((err) => {
              done(err, user);
            });
          }
        });
      }
    });
  }
}));

/**
 * Sign in with Twitter.
 */
passport.use(new TwitterStrategy({
  consumerKey: process.env.TWITTER_KEY,
  consumerSecret: process.env.TWITTER_SECRET,
  callbackURL: '/auth/twitter/callback',
  userProfileURL: 'https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true',
  passReqToCallback: true
}, (req, accessToken, tokenSecret, profile, done) => {
  if (req.account) {
    User.findOne({ $or: [{ twitter: profile.id }, { email: profile._json.email}] }, (err, existingUser) => {
      if (err) { return done(err); }
      if (existingUser) {
        req.flash('errors', { msg: 'There is already a Twitter account that belongs to you. Sign in with that account or delete it.' });
        done(err);
      } else {
        User.findById(req.account.id, (err, user) => {
          if (err) { return done(err); }

          user.twitter = profile.id;
          user.tokens.push({ kind: 'twitter', accessToken, tokenSecret });

          user.email = profile._json.email;

          user.profile.nickName = profile._json.name;
          user.profile.city = profile._json.location;
          user.profile.profilePic = {
            picture: profile._json.profile_image_url
          }
          user.profile.coverPic = [];
          user.profile.coverPic.push({
            picture: profile._json.profile_banner_url
          });

          if(profile._json.entities !== undefined
            && profile._json.entities.url !== undefined
            && profile._json.entities.url.urls !== undefined){
              user.profile.otherLink = profile._json.entities.url.urls[0].expanded_url;
            }

          user.save((err) => {
            if (err) { return done(err); }
            req.flash('info', { msg: 'Twitter account has been linked.' });
            done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({ twitter: profile.id }, (err, existingUser) => {
      if (err) { return done(err); }
      if (existingUser) {
        return done(null, existingUser);
      } else {
        User.findOne({ email: profile._json.email }, (err, existingEmailUser) => {
          if (err) { return done(err); }
          if (existingEmailUser) {
            req.flash('errors', { msg: 'There is already an account using this email address.' });
            done(err);
          } else {
            const user = new User();
            // Twitter will not provide an email address.  Period.
            // But a person’s twitter username is guaranteed to be unique
            // so we can "fake" a twitter email address as follows:
            user.twitter = profile.id;
            user.tokens.push({ kind: 'twitter', accessToken, tokenSecret });

            user.email = profile._json.email;

            user.profile.nickName = profile._json.name;
            user.profile.city = profile._json.location;
            user.profile.profilePic = {
              picture: profile._json.profile_image_url
            }
            user.profile.coverPic = [];
            user.profile.coverPic.push({
              picture: profile._json.profile_banner_url
            });

            if(profile._json.entities !== undefined
              && profile._json.entities.url !== undefined
              && profile._json.entities.url.urls !== undefined){
                user.profile.otherLink = profile._json.entities.url.urls[0].expanded_url;
              }

            user.save((err) => {
              if (err) { return done(err); }
              req.flash('info', { msg: 'Twitter account has been linked.' });
              done(err, user);
            });
          }
        });
      }
    });
  }
}));

/**
 * Sign in with Google.
 */
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_ID,
  clientSecret: process.env.GOOGLE_SECRET,
  callbackURL: '/auth/google/callback',
  passReqToCallback: true
}, (req, accessToken, refreshToken, profile, done) => {
  if (req.account) {
    const email = (profile._json.emails !== undefined && profile._json.emails.length > 0) ? profile._json.emails[0].value : '';
    User.findOne({ $or: [{ google: profile.id }, { email: email}]}, (err, existingUser) => {
      if (err) { return done(err); }
      if (existingUser) {
        req.flash('errors', { msg: 'There is already a Google account that belongs to you. Sign in with that account or delete it.' });
        done(err);
      } else {
        User.findById(req.account.id, (err, user) => {
          if (err) { return done(err); }
          user.google = profile.id;
          user.tokens.push({ kind: 'google', accessToken });

          if(profile._json.emails !== undefined && profile._json.emails.length > 0) {
            user.email = profile._json.emails[0].value;
          }

          if(profile._json.name !== undefined) {
            user.profile.lastName = profile._json.name.familyName;
            user.profile.firstName = profile._json.name.givenName;
          }

          if(profile._json.image !== undefined) {
            const img = profile._json.image.url.split('?')[0];

            if(img !== undefined){
              user.profile.profilePic = {
                picture: img
              };
            }
          }

          user.save((err) => {
            req.flash('info', { msg: 'Google account has been linked.' });
            done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({ google: profile.id }, (err, existingUser) => {
      if (err) { return done(err); }
      if (existingUser) {
        return done(null, existingUser);
      } else {
        User.findOne({ email: profile.emails[0].value }, (err, existingEmailUser) => {
          if (err) { return done(err); }
          if (existingEmailUser) {
            req.flash('errors', { msg: 'There is already an account using this email address.' });
            done(err);
          } else {
            const user = new User();
            user.google = profile.id;
            user.tokens.push({ kind: 'google', accessToken });

            if(profile._json.emails !== undefined && profile._json.emails.length > 0) {
              user.email = profile._json.emails[0].value;
            }

            if(profile._json.name !== undefined) {
              user.profile.lastName = profile._json.name.familyName;
              user.profile.firstName = profile._json.name.givenName;
            }

            if(profile._json.image !== undefined) {
              const img = profile._json.image.url.split('?')[0];

              if(img !== undefined){
                user.profile.profilePic = {
                  picture: img
                };
              }
            }

            user.save((err) => {
              done(err, user);
            });
          }
        });
      }
    });
  }
}));

/**
 * Login Required middleware.
 */
exports.isAuthenticated = (req, res, next) => {
  if(req.account !== undefined)

  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
};

/**
 * Authorization Required middleware.
 */
exports.isAuthorized = (req, res, next) => {
  const provider = req.path.split('/').slice(-1)[0];

  if (_.find(req.user.tokens, { kind: provider })) {
    next();
  } else {
    res.redirect(`/auth/${provider}`);
  }
};
