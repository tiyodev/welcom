const crypto = require('crypto');
const passport = require('passport');

const User = require('./../models/users');
const Emails = require('./../config/emails/email-exports');

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
    User.findOne({ email: resetEmail }, (err, user) => {
      if (!user) {
        reject('Account with that email address does not exist.');
      }
      createRandomToken().then((token) => {
        user.passwordResetToken = token;
        user.passwordResetExpires = Date.now() + 3600000; // 1 hour
        user.save((err) => {
          if (err) {
            console.error(err);
            reject(err);
          }
          resolve([user.email, token]);
        });
      });
    });
  });
}

/**
 * Met à jour le password du user en fonction du token
 * @param {*} token
 * @param {*} password
 */
function resetPasswordByToken(token, password) {
  return new Promise((resolve, reject) => {
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
  });
}

/**
 * GET /login
 * Log out.
 */
exports.getLogin = (req, res) => {
  if (req.user) {
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

  passport.authenticate('local', (err, user, info) => {
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
            console.error(err);
            req.flash('error', { msg: 'Problem with the email. Please contact hello@welcom.city.' });
            return res.redirect('/');
          });
        })
        .catch((err) => {
          console.error(err);
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
  res.render('account/forgot', {
    title: 'Forgot Password'
  });
};

/**
 * POST /forgot
 * Create a random token, then the send user an email with a reset link.
 */
exports.postForgot = (req, res) => {
  req.assert('email', 'Please enter a valid email address.').isEmail();
  req.sanitize('email').normalizeEmail({ remove_dots: false });

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/forgot');
  }

  setPasswordResetToken(req.body.email)
    .then((mailAndToken) => {
      const email = mailAndToken[0];
      const token = mailAndToken[1];
      Emails.sendMail(email, 'Reset your password', { templateName: 'resetPassword', host: req.headers.host, token })
      .then(() => {
        req.flash('info', { msg: `An e-mail has been sent to ${email} with further instructions.` });
        res.redirect('/');
      });
    }).catch((err) => {
      req.flash('errors', { msg: err });
      res.redirect('/forgot');
    });
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
      res.render('account/reset', {
        title: 'Password Reset'
      });
    });
};

/**
 * POST /reset/:token
 * Process the reset password request.
 */
exports.postReset = (req, res) => {
  req.assert('password', 'Password must be at least 4 characters long.').len(4);
  req.assert('confirm', 'Passwords must match.').equals(req.body.password);

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('back');
  }

  resetPasswordByToken(req.params.token, req.body.password)
  .then((user) => {
    req.logIn((user, (err) => {
      console.error(err);
    }))
    .then(() => {
      Emails.sendMail(user.email, 'Your password has been changed', { templateName: 'confirmationChangePassword' })
        .then(() => {
          req.flash('success', { msg: 'Success! Your password has been reseted.' });
          res.redirect('/');
        })
        .catch((err) => {
          console.error(err);
        });
    })
    .catch((err) => {
      console.error(err);
    });
  })
  .catch((err) => {
    req.flash('errors', { msg: err });
    res.redirect('/');
  });
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
        req.logIn(user, (err) => {
          if (err) {
            return next(err);
          }
          req.flash('success', { msg: 'Your email has been successfully validated.' });
          return res.redirect('/');
        });
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

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/');
  }

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
};
