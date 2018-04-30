const User = require('./../models/users');
const Interest = require('../models/interests');
const Experience = require('./../models/experiences');

/**
 * GET /
 * Home page.
 */
exports.getIndex = (req, res, next) => {
  Experience
    .find({})
    .limit(3)
    .sort({ createdAt: -1 })
    .select({
      _id: 1, creator: 1, coverPic: 1, title: 1, isFree: 1, nbRecommendation: 1
    })
    .populate({ path: 'interests', select: 'name _id', model: Interest })
    .populate({ path: 'creator', select: 'profile.profilePic profile.firstName profile.nickName', model: User })
    .exec((err, exps) => {
      if (err) { next(err); }

      res.render('index', { title: 'Welcom\' Home', exps });
    });
};
