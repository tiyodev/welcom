// import { Promise } from 'mongoose';

const languages = require('../data/language');
const adjectives = require('../data/adjective');
const mongoose = require('mongoose');
const myFs = require('../utils/myFs');

const User = require('./../models/users');
const Interest = require('../models/interests');
const Experience = require('./../models/experiences');
const Tag = require('./../models/interests');
const Recommendations = require('./../models/recommendations');

const { check, validationResult } = require('express-validator/check');
const { sanitize, matchedData } = require('express-validator/filter');

function calcAge(data) {
  const now = new Date();
  let age = now - data;
  age = Math.floor(age / 1000 / 60 / 60 / 24 / 365);
  return age;
}

exports.checkProfileData = [
  check('firstName', 'The size of the first name must be between 1 and 50 characters').trim().isLength({ max: 50 }),
  check('lastName', 'The size of the last name must be between 1 and 50 characters').trim().isLength({ max: 50 }),
  check('nickName', 'Please chose a nickname (2 to 20 signs)').trim().isLength({ min: 2, max: 20 }),
  check('email', 'A valid email is needed').trim().isLength({ min: 1 }).isEmail(),
  sanitize('email').normalizeEmail(),
  check('mobileNumber', 'The mobile phone number must be supplied with the country code and therefore must start with +')
    .trim().optional({ checkFalsy: true }).isMobilePhone('any', { strictMode: true }),
  check('city', 'Please, let the community know where you live').trim().isLength({ min: 1 }),
  check('gender', 'Please let us know what pronoun we should use').trim().isIn(['Man', 'Woman']),
  check('birthdate', 'Please tell us your date of birth, it won\'t be displayed').isISO8601().isBefore(),
  sanitize('birthdate').toDate(),
  check('adjective', 'Please chose the adjective that best describes you').trim().isLength({ min: 1 }),
  check('languageSpoken', 'Please tell us your spoken languages').trim().isLength({ min: 1 }),
  check('languageLearning').trim().optional({ checkFalsy: true }),
  // check('tags[]', 'Please chose at least one hobby').trim().isLength({ min: 1 }),
  check('inputIntro', 'Please, tell us a little bit about you (30 signs min)').trim().isLength({ min: 30, max: 200 }),
  check('inputBio', 'Please, tell us a little bit about your life (100 signs min)').trim().isLength({ min: 100, max: 2000 }),
  check('inputSharing', 'Please, write something about what you would like to share (30 signs min)').trim().isLength({ min: 30, max: 600 }),
  check('inputTripLived', 'Between 20 and 300 characters').trim().optional({ checkFalsy: true }).isLength({ min: 20, max: 300 }),
  check('inputFutureTravel', 'Between 20 and 300 characters').trim().optional({ checkFalsy: true }).isLength({ min: 20, max: 300 }),
  check('facebookLink', 'Please let us a valid URL').trim().optional({ checkFalsy: true }).isURL({
    protocols: ['http', 'https'],
    require_tld: true,
    require_protocol: false,
    require_host: true,
    require_valid_protocol: true,
    allow_underscores: false
  }),
  check('instagramLink', 'Please let us a valid URL').trim().optional({ checkFalsy: true }).isURL({
    protocols: ['http', 'https'],
    require_tld: true,
    require_protocol: false,
    require_host: true,
    require_valid_protocol: true,
    allow_underscores: false
  }),
  check('twitterLink', 'Please let us a valid URL').trim().optional({ checkFalsy: true }).isURL({
    protocols: ['http', 'https'],
    require_tld: true,
    require_protocol: false,
    require_host: true,
    require_valid_protocol: true,
    allow_underscores: false
  }),
  check('otherLink', 'Please let us a valid URL').trim().optional({ checkFalsy: true }).isURL({
    protocols: ['http', 'https'],
    require_tld: true,
    require_protocol: false,
    require_host: true,
    require_valid_protocol: true,
    allow_underscores: false
  })
];

exports.checkRecommendationData = [
  check('recommendationDesc', 'Please, write a recommendations (30 to 300 signs).').trim().isLength({ min: 30, max: 300 })
];

/**
 * GET /
 * Profile Page
 */
exports.getProfile = (req, res, next) => {
  if (req.params.id) {
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      User.findById(req.params.id, (err, user) => {
        if (err) {
          next(err);
        }
        if (!user) { next(new Error('Wrong ID!')); }

        if (!user.profile.nbRecommendation) { user.profile.nbRecommendation = 0; }

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

        const isConnectedUser = user._id.equals(req.account._id);

        res.render('profile/profile', {
          title: 'Profile', user, shortPresentationSentence, shortLearnSentence, isConnectedUser
        });
      }).populate({ path: 'profile.interests', select: 'name _id', model: Interest });
    } else { next(new Error('Wrong ID!')); }
  } else {
    next(new Error('Id not found'));
  }
};

/**
 * GET /
 * Edit Profile Page
 */
exports.getEditProfile = (req, res) => {
  let coverPicInitialPreview = '';
  let coverPicInitialPreviewConfig = '';
  let profilePicInitialPreview = '';
  let profilePicInitialPreviewConfig = '';

  if (req.account.profile.coverPic !== undefined && req.account.profile.coverPic.length > 0) {
    req.account.profile.coverPic.forEach((item) => {
      coverPicInitialPreview += `'${item.picture}',`;
      coverPicInitialPreviewConfig += `{caption: '${item.label}', width: '200px', url: '/profile/edit/cover-upload/delete', key: '${item._id}'},`;
    });
  }

  if (req.account.profile.profilePic.picture !== undefined) {
    profilePicInitialPreview = `'${req.account.profile.profilePic.picture}'`;
    profilePicInitialPreviewConfig = `{caption: '${req.account.profile.profilePic.label}', width: '200px', url: '/profile/edit/profile-pic-upload/delete'}`;
  }

  res.render('profile/edit-profile', {
    title: 'Edit Profile',
    languages,
    adjectives,
    user: req.account,
    coverPicInitialPreview,
    coverPicInitialPreviewConfig,
    profilePicInitialPreview,
    profilePicInitialPreviewConfig
  });
};

/**
 * POST /
 * Edit Profile Page
 */
exports.postEditProfile = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.render('profile/edit-profile', {
      title: 'Edit Profile',
      languages,
      adjectives,
      user: req.account,
      errors: errors.array(),
      validData: matchedData(req)
    });
  }

  // Get a promises array, one by tag
  const pArray = req.body.tags.map(async (tag) => {
    if (tag !== undefined && tag !== null && tag !== '') {
      try {
        const findTag = await Tag.findOne({ name: tag });

        // If the tag alreeady exist, return tag id.
        if (findTag !== null) {
          return findTag._id;
        }
      } catch (err) {
        next(err);
      }

      try {
        // Else create a new Tag
        const newTag = new Tag();
        newTag.name = tag;
        newTag._id = mongoose.Types.ObjectId();

        await newTag.save();

        return newTag._id;
      } catch (err) {
        next(err);
      }
    }
  });

  // Wait all promises
  Promise.all(pArray).then((tagsId) => {
    // Update user informations
    User.findById(req.account._id, (err, user) => {
      if (err) { next(err); }

      user.email = req.body.email;
      user.profile.nickName = req.body.nickName;
      user.profile.lastName = req.body.lastName;
      user.profile.firstName = req.body.firstName;
      user.profile.phoneNumber = req.body.mobileNumber;
      user.profile.city = req.body.city;
      user.profile.gender = req.body.gender.toLowerCase();
      user.profile.adjective = req.body.adjective;
      user.profile.birthdate = req.body.birthdate;
      if (Array.isArray(req.body.languageSpoken)) {
        user.profile.spokenLanguages = req.body.languageSpoken.map(lang => ({
          language: lang,
          isoCode: ''
        }));
      } else if (typeof req.body.languageSpoken === 'string') {
        user.profile.spokenLanguages = {
          language: req.body.languageSpoken,
          isoCode: ''
        };
      } else {
        user.profile.spokenLanguages = null;
      }
      if (Array.isArray(req.body.languageLearning)) {
        user.profile.learningLanguages = req.body.languageLearning.map(lang => ({
          language: lang,
          isoCode: ''
        }));
      } else if (typeof req.body.languageLearning === 'string') {
        user.profile.learningLanguages = {
          language: req.body.languageLearning,
          isoCode: ''
        };
      } else {
        user.profile.learningLanguages = null;
      }
      user.profile.intro = req.body.inputIntro;
      user.profile.interests = tagsId;
      user.profile.description = req.body.inputBio;
      user.profile.shareWithCommunity = req.body.inputSharing;
      user.profile.tripLived = req.body.inputTripLived;
      user.profile.travelPlan = req.body.inputFutureTravel;
      user.profile.facebookLink = req.body.facebookLink;
      user.profile.twitterLink = req.body.twitterLink;
      user.profile.instagramLink = req.body.instagramLink;
      user.profile.otherLink = req.body.otherLink;

      user.save((err) => {
        if (err) { next(err); }

        res.redirect(`/profile/${user._id}`);
      });
    });
  });
};

/**
 * POST /
 * Upload profile cover images
 */
exports.postAddProfileCover = (req, res, next) => {
  User.findById(req.account._id, (err, user) => {
    if (err) { next(err); }

    // If number of cover pic > 5, return an error
    if (user.profile.coverPic.length >= 5) {
      myFs.deleteTmpUploadImg(req.files[0]);
      return res.json({
        success: 'false',
        error: 'Number of files for profile cover exceeds maximum allowed limit of 5.'
      });
    }

    // Déplacer les fichiers dans la destination
    myFs.moveProfileCoverImg(req.account._id, req.files[0])
      .then((result) => {
        const filePath = `/profile/${req.account._id}/${result.newFileName}`;

        const id = mongoose.Types.ObjectId();
        user.profile.coverPic.push({
          picture: filePath,
          label: result.newFileName,
          _id: id
        });

        user.save((err) => {
          if (err) return next(err);
          return res.json({
            success: 'true',
            initialPreview: [`../../..${filePath}`],
            initialPreviewConfig: [{
              caption: result.newFileName, width: '200px', url: '/profile/edit/cover-upload/delete', key: id
            }],
            append: true,
            fileUrl: filePath
          });
        });
      })
      .catch((err) => { console.error(err); });
  });
};

/**
 * POST /
 * Delete profile cover images
 */
exports.postDeleteProfileCover = (req, res, next) => {
  User.findById(req.account._id, (err, user) => {
    if (err) { next(err); }

    const index = user.profile.coverPic.findIndex(item => item._id.equals(req.body.key));

    const deleteItem = user.profile.coverPic.splice(index, 1);

    myFs.deleteUploadImg(deleteItem)
      .then((msg) => { console.info(msg); })
      .catch((err) => { console.error(err); });

    user.save((err) => {
      if (err) return next(err);
      return res.json({ success: 'true', key: req.body.key, test: 'deleteFile' });
    });
  });
};

/**
 * POST /
 * Upload profile picture
 */
exports.postAddProfilePic = (req, res, next) => {
  User.findById(req.account._id, (err, user) => {
    if (err) { next(err); }

    // Déplacer les fichiers dans la destination
    myFs.moveProfileCoverImg(req.account._id, req.file)
      .then((result) => {
      // If there are already a picture, delete it
        if (user.profile.profilePic.picture !== undefined) {
          myFs.deleteProfilePic(user.profile.profilePic)
            .then((msg) => { console.info(msg); })
            .catch((err) => { console.error(err); });
        }

        const filePath = `/profile/${req.account._id}/${result.newFileName}`;

        const id = mongoose.Types.ObjectId();

        user.profile.profilePic = {
          picture: filePath,
          label: result.newFileName
        };

        user.save((err) => {
          if (err) return next(err);
          return res.json({
            success: 'true',
            initialPreview: [`../../..${filePath}`],
            initialPreviewConfig: [{
              caption: result.newFileName, width: '200px', url: '/profile/edit/cover-upload/delete', key: id
            }],
            fileUrl: filePath
          });
        });
      })
      .catch((err) => { console.error(err); });
  });
};

/**
 * POST /
 * Delete profile picture
 */
exports.postDeleteProfilePic = (req, res, next) => {
  User.findById(req.account._id, (err, user) => {
    if (err) { next(err); }

    myFs.deleteProfilePic(user.profile.profilePic)
      .then((msg) => { console.info(msg); })
      .catch((err) => { console.error(err); });

    user.profile.profilePic = {};

    user.save((err) => {
      if (err) return next(err);

      return res.json({ success: 'true', key: req.body.key });
    });
  });
};



const getUserById = (userId) => {
  return new Promise((resolve, reject) => {
    User.findById(userId, (err, user) => {
      if (err) {
        reject(err);
      }
      if (!user) { reject(new Error('Wrong ID!')); }

      // console.log('ybo : ' + JSON.stringify(user));

      resolve(user);
    })
    .populate({ 
      path: 'profile.recommendations',
      model: Recommendations, 
      populate: { 
        path: 'writer', 
        select: '_id profile.nickName profile.firstName profile.city profile.profilePic', 
        model: User
      } 
    });
  });
}

const saveRecommendation = ({user, data, req}) => {
  // Add recommendations
  const newRecommendation = new Recommendations();
  newRecommendation._id = mongoose.Types.ObjectId();
  newRecommendation.isForProfile = true;
  newRecommendation.isForExperience = false;
  newRecommendation.description = req.body.recommendationDesc;
  newRecommendation.writer = req.account._id;

  return newRecommendation.save().then(() => new Promise((resolve, reject) => {
    if(user.profile.recommendations === undefined || user.profile.recommendations === null){
      user.profile.recommendations = [];
    }

    user.profile.recommendations.push(newRecommendation._id);

    user.save().then( resolve({user, data}) ).catch( err => reject(err));
  }));
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

const checkAddRecommendationData = ({user, data, req, res}) => {
  return new Promise((resolve, reject) => {
    /** Test form errors */
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.render('profile/recommendation', {
        title: 'Recommendations',
        user,
        data,
        errors: errors.array(),
        validData: matchedData(req),
        isFromAddRecommendation: true
      });
    }

    resolve({user, data});
  });
}

/**
 * GET /
 * Profile Page / Recommendations
 */
exports.getRecommendation = (req, res, next) => {
  if (req.params.id) {
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      
      getUserById(req.params.id)
      .then((user) => getGeneralProfileInformation({user: user, accountId: req.account._id}))
      .then(({user, data}) => {
        res.render('profile/recommendation', {
          title: 'Recommendations', 
          user, 
          data
        });
      })
      .catch(err => next(err));

    } else { next(new Error('Wrong ID!')); }
  } else {
    next(new Error('Id not found'));
  }
};

/**
 * POST /
 * Profile Page / Recommendations
 * Add a recommendation
 */
exports.postRecommendation = (req, res, next) => {
  if (req.params.id) {
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {

        getUserById(req.params.id)
        .then((user) => getGeneralProfileInformation({user: user, accountId: req.account._id}))
        .then(({user, data}) => checkAddRecommendationData({user: user, data: data, req: req, res: res}))
        .then(({user, data}) => saveRecommendation({user, data, req}))
        .then(({user, data}) => {
          res.redirect(`/profile/${user._id}/recommendation`);
        })
        .catch(err => next(err));

    } else { next(new Error('Wrong ID!')); }
  } else {
    next(new Error('Id not found'));
  }
};


/**
 * GET /
 * Profile Page / Experiences
 */
exports.getExperience = (req, res, next) => {
  if (req.params.id) {
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      User.findById(req.params.id, (err, user) => {
        if (err) {
          next(err);
        }
        if (!user) { next(new Error('Wrong ID!')); }

        if (!user.profile.nbRecommendation) { user.profile.nbRecommendation = 0; }

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

        const isConnectedUser = user._id.equals(req.account._id);

        Experience.find({ creator: user._id }, '_id creator coverPic title isFree recommendations', (err, exps) => {
          if (err) { next(err); }

          /** ***************** TEMP DATA => JUST FOR FRONT ************************** */
          let nbWelcomerRecommendations = 0;
          let expsArray = [...exps];
          let i = 0;

          for(i; i < expsArray.length; i++){
            if(expsArray[i].recommendations){
              nbWelcomerRecommendations = nbWelcomerRecommendations + expsArray[i].recommendations.length;
            }
          }

          const data = {
            nbWelcomerRecommendations,
            experiencesDesc: `I'm so proud to be a welcomer ! So much to do in my city, 
              but I prefer is to do that and that and this with beers and flowers.`
          };
          /** ***************** TEMP DATA => JUST FOR FRONT ************************** */

          res.render('profile/experience', {
            title: 'Experiences',
            data,
            exps,
            user,
            shortPresentationSentence,
            shortLearnSentence,
            isConnectedUser,
            isExpEditable: true,
            isExpViewable: true
          });
        })
        .populate({ path: 'interests', select: 'name _id', model: Interest })
        .populate({ path: 'creator', select: 'profile.profilePic profile.firstName profile.nickName', model: User });
      }).populate({ path: 'profile.interests', select: 'name _id', model: Interest });
    } else { next(new Error('Wrong ID!')); }
  } else {
    next(new Error('Id not found'));
  }
};

/**
 * GET /
 * Profile Page / Dashboard
 */
exports.getDashboard = (req, res, next) => {
  if (req.params.id) {
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      User.findById(req.params.id, (err, user) => {
        if (err) {
          next(err);
        }
        if (!user) { next(new Error('Wrong ID!')); }

        if (!user.profile.nbRecommendation) { user.profile.nbRecommendation = 0; }

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

        const isConnectedUser = user._id.equals(req.account._id);

        /** ***************** TEMP DATA => JUST FOR FRONT ************************** */
        const exps = {
          asTraveler1: {

          },
          asTraveler: {
            pending: [{
              welcomerProfilePic: '/images/sampleProfilePic1.png',
              title: 'Title to the experience which can be very long + link ti the exp... f zef ze fozef zeoifj zeoijf oziej fozef ',
              welcomerDisplayName: 'Yohann',
              date: new Date(Date.now()),
              nbTravellers: 2,
              expCover: '/images/expImg2.jpg'
            }],
            come: [{
              welcomerProfilePic: '/images/sampleProfilePic2.png',
              title: 'Title to the experience which can be very long + link ti the exp...',
              welcomerDisplayName: 'JB',
              date: new Date(Date.now()),
              nbTravellers: 5,
              expCover: '/images/expImg3.jpg'
            }],
            past: [{
              welcomerProfilePic: '/images/sampleProfilePic2.png',
              title: 'Title to the experience which can be very long + link ti the exp...',
              welcomerDisplayName: 'Thomasson',
              date: new Date(Date.now()),
              nbTravellers: 1,
              expCover: '/images/expImg1.jpg'
            }]
          },
          asWelcomer1: {

          },
          asWelcomer: {
            pending: [{
              travelerProfilePic: '/images/sampleProfilePic2.png',
              title: 'Title to the experience which can be very long + link ti the exp...',
              travelerDisplayName: 'Yohann',
              date: new Date(Date.now()),
              nbTravellers: 2,
              expCover: '/images/expImg1.jpg',
              travelerMsg: '[Message the traveller wrote] Hello! We are from Bishek and we would love to see Paris with you you you you you you you youyou you you youyou you you youyou you you youyou you you youyou you you you'
            }],
            come: [{
              travelerProfilePic: '/images/sampleProfilePic1.png',
              title: 'Title to the experience which can be very long + link ti the exp...',
              travelerDisplayName: 'JB',
              date: new Date(Date.now()),
              nbTravellers: 5,
              expCover: '/images/expImg2.jpg'
            }],
            past: [{
              travelerProfilePic: '/images/sampleProfilePic2.png',
              title: 'Title to the experience which can be very long + link ti the exp...',
              travelerDisplayName: 'Thomasson',
              date: new Date(Date.now()),
              nbTravellers: 1,
              expCover: '/images/expImg3.jpg'
            }]
          }
        };
        /** ***************** TEMP DATA => JUST FOR FRONT ************************** */

        res.render('profile/dashboard', {
          title: 'Dashboard', exps, user, shortPresentationSentence, shortLearnSentence, isConnectedUser
        });
      }).populate({ path: 'profile.interests', select: 'name _id', model: Interest });
    } else { next(new Error('Wrong ID!')); }
  } else {
    next(new Error('Id not found'));
  }
};
