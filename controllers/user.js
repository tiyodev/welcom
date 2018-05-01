const crypto = require('crypto');
const passport = require('passport');

const { check, validationResult } = require('express-validator/check');
const { sanitize, matchedData } = require('express-validator/filter');

const User = require('./../models/users');
const Emails = require('./../config/emails/email-exports');

exports.checkEmailData = [
  check('inputEmail')
  .isLength({ min: 1 }).withMessage('Email is required.')
  .isEmail().withMessage('Must be a valid email.')
  .trim()
  .normalizeEmail()
  .custom(value => {
    return User.findOne({ email: value })
      .then((existingUser) => {
        if(!existingUser){
          throw new Error('This email is not found');
        }
      })
  })
];

exports.checkResetPwdData = [
  check('password', `Password don't match all rules.`)
  .trim()
  .matches(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$/),
  check('confirmPwd', `Confirm password don't match with password.`)
  .trim()
  .custom((value, { req }) => {
    if (req.body.password === value) {
      return true;
    }
    return false;
  })
];

/**
 * Créé un token en hexa
 */
function createRandomToken() {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(16, (err, buf) => {
      if (err) {
        reject(err);
      } else {
        resolve(buf.toString('hex'));
      }
    });
  });
}

/**
 * Met à jour le token du user si celui-ci est périmé.
 * @param {*} user
 * User à updater.
 */
function updateValidEmailToken(user) {
  return new Promise((resolve, reject) => {
    if (Date.now() > user.validEmailTokenExpires.getTime()) {
      // Si l'utilisateur n'a toujours pas validé son mail, un nouveau est recréé
      createRandomToken()
        .then((newToken) => {
          User.findById(user._id, (err, user) => {
            user.validEmailToken = newToken;
            user.validEmailTokenExpires = Date.now() + 3600000;
            user.save((err) => {
              if (err) {
                console.error(err);
                reject(err);
              }
              resolve(newToken);
            });
          });
        });
    } else {
      resolve(user.validEmailToken);
    }
  });
}

/**
 * Créé le token pour le reset du password
 * Le token expire après 1h
 * @param {*} resetEmail
 */
function setPasswordResetToken(resetEmail) {
  return new Promise((resolve, reject) => {
    if(resetEmail === undefined){
      reject('Email undefined');
    }
    else{
      User.findOne({ email: resetEmail, facebook: { $exists: false }, google: { $exists: false }, twitter: { $exists: false } })
      .then((user) => {
        if(user !== null && user !== undefined){
          createRandomToken()
          .then((token) => {
            user.passwordResetToken = token;
            user.passwordResetExpires = Date.now() + 3600000; // 1 hour
            user.save((err) => {
              if (err) {
                reject(err);
              }
              resolve([user.email, token]);
            });
          })
          .catch((err) => {
            reject(err);
          });
        }
        else
        {
          reject('This user use an external api to connect to our web site. Impossible to change password.');
        }
      })
      .catch((err) => {
        reject(err);
      });
    }
  });
}

/**
 * Met à jour le password du user en fonction du token
 * @param {*} token
 * @param {*} password
 */
function resetPasswordByToken(token, password) {
  return new Promise((resolve, reject) => {
    if(password === undefined || password === null || password == ''){
      reject(`Password can't be empty`);
    }
    else
    {
      User
      .findOne({ passwordResetToken: token })
      .where('passwordResetExpires').gt(Date.now())
      .exec((err, user) => {
        if (err) {
          reject(err);
        }
        if (!user) {
          reject('Password reset token is invalid or has expired.');
        }
        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        user.save((err) => {
          if (err) {
            reject('An error occured while reseting the password');
          }
          resolve(user);
        });
      });
    }
  });
}

/**
 * GET /login
 * Log out.
 */
exports.getLogin = (req, res) => {
  if (req.account) {
    res.redirect('/');
  }
  res.render('login', {
    title: 'Login'
  });
};

/**
 * POST /login
 * Sign in using email and password.
 */
exports.postLogin = (req, res, next) => {
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('password', 'Password cannot be blank').notEmpty();
  req.sanitize('email').normalizeEmail({ remove_dots: false });

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/');
  }

  passport.authenticate('local', {assignProperty: 'user'},(err, user, info) => {
    if (err) { return next(err); }
    if (!user) {
      req.flash('errors', info);
      return res.redirect('/');
    }
    if (!user.validEmail) {
      updateValidEmailToken(user)
        .then((newToken) => {
          Emails.sendMail(user.email, 'Confirm your email address', { templateName: 'validEmail', host: req.headers.host, token: newToken })
            .then(() => {
              req.flash('info', { msg: `An email has been sent again to ${user.email} with a new link valid for one hour. Please validate it to log in.` });
              return res.redirect('/');
            })
            .catch((err) => {
              req.flash('error', { msg: 'Problem with the email. Please contact hello@welcom.city.' });
              return res.redirect('/');
            });
        })
        .catch((err) => {
          return res.redirect('/');
        });
    } else {
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        req.flash('success', { msg: 'Success ! You are logged in.' });
        res.redirect(req.session.returnTo || '/');
      });
    }
  })(req, res, next);
};

/**
 * GET /logout
 * Log out.
 */
exports.logout = (req, res) => {
  req.logout();
  res.redirect('/');
};

/**
 * GET /forgot
 * Forgot Password page.
 */
exports.getForgot = (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  res.render('account/forgot-pwd', {
    title: 'Forgot Password'
  });
};

/**
 * POST /forgot
 * Create a random token, then the send user an email with a reset link.
 */
exports.postForgot = (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.render('account/forgot-pwd', {
      title: 'Forgot password',
      errors: errors.array(),
      validData: matchedData(req)
    });
  }

  if(req.body.inputEmail !== undefined){
    setPasswordResetToken(req.body.inputEmail)
    .then((mailAndToken) => {
      const email = mailAndToken[0];
      const token = mailAndToken[1];
      Emails.sendMail(email, 'Reset your password', { templateName: 'resetPassword', host: req.headers.host, token })
        .then(() => {
          req.flash('info', { msg: `An e-mail has been sent to ${email} with further instructions.` });
          res.redirect('/');
        });
    }).catch((err, data) => {
      req.flash('errors', { msg: err });
      res.redirect('/forgot');
    });
  }
};

/**
 * GET /reset/:token
 * Reset Password page.
 */
exports.getReset = (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  User
    .findOne({ passwordResetToken: req.params.token })
    .where('passwordResetExpires').gt(Date.now())
    .exec((err, user) => {
      if (err) { return next(err); }
      if (!user) {
        req.flash('errors', { msg: 'Password reset token is invalid or has expired.' });
        return res.redirect('/forgot');
      }
      res.render('account/reset-pwd', {
        title: 'Password Reset',
        token: req.params.token
      });
    });
};

/**
 * POST /reset/:token
 * Process the reset password request.
 */
exports.postReset = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.render('account/reset-pwd', {
      title: 'Password Reset',
      token: req.params.token,
      errors: errors.array(),
      validData: matchedData(req)
    });
  }

  const resetPassword = () =>
    User
      .findOne({ passwordResetToken: req.params.token })
      .where('passwordResetExpires').gt(Date.now())
      .then((user) => {
        if (!user) {
          req.flash('errors', { msg: 'Password reset token is invalid or has expired.' });
          return res.redirect('back');
        }
        user.password = req.body.password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        return user.save().then(() => new Promise((resolve, reject) => {
          req.logIn(user, (err) => {
            if (err) { return reject(err); }
            resolve(user);
          });
        }));
      });

  const sendResetPasswordEmail = (user) => {
    if (!user) { return; }

    return Emails.sendMail(user.email, 'Your password has been changed', { templateName: 'confirmationChangePassword' })
    .then(() => {
      req.flash('success', { msg: 'Success! Your password has been changed.' });
    });
  };

  resetPassword()
    .then(sendResetPasswordEmail)
    .then(() => { if (!res.finished) res.redirect('/'); })
    .catch(err => next(err));
};

/**
 * GET /verifyEmail
 * Verify email page.
 */
exports.getVerifyEmail = (req, res, next) => {
  User
    .findOne({ validEmailToken: req.params.validEmailToken })
    .where('validEmailTokenExpires').gt(Date.now())
    .exec((err, user) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        req.flash('errors', { msg: 'Verify email token is invalid or has expired.' });
        return res.redirect('back');
      }
      user.validEmail = true;
      if (typeof user.newEmail !== 'undefined') {
        user.email = user.newEmail;
        user.newEmail = undefined;
      }
      user.validEmailToken = undefined;
      user.validEmailTokenExpires = undefined;

      user.save((err) => {
        if (err) {
          return next(err);
        }

        return res.redirect('/');

        // req.logIn(user, (err) => {
        //   if (err) {
        //     return next(err);
        //   }
        //   req.flash('success', { msg: 'Your email has been successfully validated.' });
        //   return res.redirect('/');
        // });
      });
    });
};

/**
 * Get /signup
 * Page de signup
 */
exports.getSignup = (req, res) => {
  res.render('signup', {
    title: 'Signup'
  });
};

/**
 * POST /signup
 * Create a new local account.
 */
exports.postSignup = (req, res) => {
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('password', 'Password must be at least 4 characters long').len(4);
  req.sanitize('email').normalizeEmail({ remove_dots: false });

  req.getValidationResult()
    .then(() => {
      const user = new User({
        email: req.body.email,
        password: req.body.password,
        validEmailTokenExpires: Date.now() + 3600000
      });

      createRandomToken()
        .then((newToken) => {

          user.validEmailToken = newToken;

          User.findOne({ email: req.body.email }, (err, existingUser) => {
            if (existingUser) {
              req.flash('errors', { msg: 'Account with that email address already exists.' });
              res.redirect('/');
            } else {
              user.save()
                .then(() => {
                  Emails.sendMail(user.email, 'Confirm your email address', { templateName: 'validEmail', host: req.headers.host, token: user.validEmailToken })
                    .then(() => {
                      req.flash('info', { msg: `You will receive an Email at ${user.email} with instructions within the next 5 minutes (usually instant).` });
                      res.redirect('/');
                    }).catch((err) => {
                      req.flash('errors', { msg: err });
                      console.error(err);
                      res.redirect('/');
                    });
                })
                .catch((err) => {
                  req.flash('errors', { msg: err });
                  console.error(err);
                  res.redirect('/');
                });
            }
          });
        })
        .catch((err) => {
          req.flash('errors', { msg: err });
          console.error(err);
          res.redirect('/');
        });
    })
    .catch((errors) => {
      console.error(errors);
      req.flash('errors', errors);
      return res.redirect('/');
    });
};
