const User = require('./../models/users');

const { check, validationResult } = require('express-validator/check');
const { matchedData } = require('express-validator/filter');

exports.checkBecomeWelcomerData = [
  check('inputBecomeWelcomer', 'Please, tell us why do you want to become a welcomer. (100 signs min)').trim().isLength({ min: 100, max: 2000 }),
];

/**
 * GET /
 * Become welcomer
 */
exports.getBecomeWelcomer = (req, res) => {
  const exps = [{
    headerPic: '/images/default-img-card.jpg',
    nbRecommendation: 5,
    profilePic: '/images/default-profile-pic.jpg',
    displayName: 'Thomasson',
    expDesc: 'Explore the wonderful Golden Triangle together'
  },
  {
    headerPic: '/images/default-img-card.jpg',
    nbRecommendation: 5,
    profilePic: '/images/default-profile-pic.jpg',
    displayName: 'Thomasson',
    expDesc: 'Explore the wonderful Golden Triangle together'
  },
  {
    headerPic: '/images/default-img-card.jpg',
    nbRecommendation: 5,
    profilePic: '/images/default-profile-pic.jpg',
    displayName: 'Thomasson',
    expDesc: 'Explore the wonderful Golden Triangle together'
  }];

  res.render('become-welcomer', { title: 'Become welcomer', user: req.account, exps });
};

/**
 * POST /
 * Become welcomer
 */
exports.postBecomeWelcomer = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.render('become-welcomer', {
      title: 'Become welcomer',
      errors: errors.array(),
      validData: matchedData(req)
    });
  }

  const exps = [{
    headerPic: '/images/default-img-card.jpg',
    nbRecommendation: 5,
    profilePic: '/images/default-profile-pic.jpg',
    displayName: 'Thomasson',
    expDesc: 'Explore the wonderful Golden Triangle together'
  },
  {
    headerPic: '/images/default-img-card.jpg',
    nbRecommendation: 5,
    profilePic: '/images/default-profile-pic.jpg',
    displayName: 'Thomasson',
    expDesc: 'Explore the wonderful Golden Triangle together'
  },
  {
    headerPic: '/images/default-img-card.jpg',
    nbRecommendation: 5,
    profilePic: '/images/default-profile-pic.jpg',
    displayName: 'Thomasson',
    expDesc: 'Explore the wonderful Golden Triangle together'
  }];

  User.findById(req.account._id, (err, user) => {
    if (err) { next(err); }

    user.welcomerReason = req.body.inputBecomeWelcomer;

    user.save((err) => {
      if (err) { next(err); }

      res.render('become-welcomer', { title: 'Become welcomer', user, exps });
    });
  });
};
