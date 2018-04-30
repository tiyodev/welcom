const express = require('express');
const passport = require('passport');

const router = express.Router();

/**
 * OAuth authentication routes. (Sign in)
 */

router.get('/facebook', passport.authenticate('facebook', { scope: ['email', 'user_location'] }));
router.get('/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/', successRedirect: '/' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});

router.get('/google', passport.authenticate('google', { scope: 'profile email' }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/', successRedirect: '/'}), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});

router.get('/twitter', passport.authenticate('twitter'));
router.get('/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/', successRedirect: '/' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});

module.exports = router;
