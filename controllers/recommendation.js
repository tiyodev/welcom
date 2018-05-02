const mongoose = require('mongoose');

const User = require('./../models/users');
const Recommendations = require('./../models/recommendations');

const { check, validationResult } = require('express-validator/check');
const { sanitize, matchedData } = require('express-validator/filter');

exports.checkRecommendationResponseData = [
  check('recommendationResponseDesc', 'Please, write a recommendations (30 to 200 signs).').trim().isLength({ min: 30, max: 200 }),
];

function calcAge(data) {
  const now = new Date();
  let age = now - data;
  age = Math.floor(age / 1000 / 60 / 60 / 24 / 365);
  return age;
}

const getUserById = (userId) => {
  return new Promise((resolve, reject) => {
    User.findById(userId, (err, user) => {
      if (err) {
        reject(err);
      }
      if (!user) { reject(new Error('Wrong user ID!')); }

      resolve(user);
    })
    .populate({ 
      path: 'profile.recommendations', 
      model: Recommendations, 
      populate: { 
        path: 'writer', 
        select: '_id profile.nickName profile.city profile.profilePic', 
        model: User
      } 
    });
  });
}

const getGeneralProfileInformation = ({user, accountId}) => {
  return new Promise((resolve, reject) => {
    const age = calcAge(user.profile.birthdate);
    const shortPresentationSentence = `${user.profile.adjective} ${age} years old traveller from ${user.profile.city}`;
    const genderAdv = user.profile.gender === 'man' ? 'He' : 'She';
    let i = 0;
    let spokenLanguages = '';
    if (user.profile.spokenLanguages && Array.isArray(user.profile.spokenLanguages)) {
      user.profile.spokenLanguages.forEach((elem) => {
        if (i++ > 0) spokenLanguages += ' and ';
        spokenLanguages += elem.language;
      });
    }
    i = 0;
    let learningLanguages = '';
    if (user.profile.learningLanguages && Array.isArray(user.profile.learningLanguages)) {
      user.profile.learningLanguages.forEach((elem) => {
        if (i++ > 0) learningLanguages += ' and ';
        learningLanguages += elem.language;
      });
    }

    let shortLearnSentence = `${genderAdv} speaks ${spokenLanguages}`;

    if (learningLanguages) { shortLearnSentence += `, and learns ${learningLanguages}`; }

    const isConnectedUser = user._id.equals(accountId);

    /** ***************** TEMP DATA => JUST FOR FRONT ************************** */
    const recommendationDescription = 'Really happy that the travellers I meet from all over the world like my experiences that much! It\'s perfect.';
    /** ***************** TEMP DATA => JUST FOR FRONT ************************** */

    const data = {
      shortPresentationSentence, 
      shortLearnSentence, 
      isConnectedUser, 
      recommendationDescription
    };
    resolve({user, data});
  });
}

const checkAddRecommendationResponseData = ({user, data, req, res}) => {
  return new Promise((resolve, reject) => {
    /** Test form errors */
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.render('profile/recommendation', {
        title: 'Recommendations',
        user,
        data,
        errors: errors.array(),
        validData: matchedData(req)
      });
    }

    resolve({user, data});
  });
}

/**
 * POST /
 * Profile Page / Recommendations
 * Add a recommendation answer
 */
exports.postRecommendationResponse = (req, res, next) => {
  if (req.params.id) {
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      getUserById(req.body.userId)
        .then((user) => getGeneralProfileInformation({user: user, accountId: req.account._id}))
        .then(({user, data}) => checkAddRecommendationResponseData({user: user, data: data, req: req, res: res}))
        .then(({user, data}) => {
          Recommendations.findById(req.params.id, (err, recommendation) => {
            if (err) {
              next(err);
            }
            if (!recommendation) { next(new Error('Wrong ID!')); }
      
            recommendation.response = {
              description: req.body.recommendationResponseDesc,
              responseDate : Date.now()
            }

            // Save recommendation
            recommendation.save((err) => {
              if (err) next(err);

              getUserById(req.body.userId)
              .then((user) => {
                res.render('profile/recommendation', {
                  title: 'Recommendations', 
                  user, 
                  data
                });
              })
              .catch(err => next(err));
            });
          });
        })
        .catch(err => next(err));
    } else { next(new Error('Wrong ID!')); }
  } else {
    next(new Error('Id not found'));
  }
};