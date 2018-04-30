const Experience = require('./../models/experiences');
const Tag = require('./../models/interests');
const User = require('./../models/users');
const Interest = require('../models/interests');

const { check, validationResult } = require('express-validator/check');
const { sanitize, matchedData } = require('express-validator/filter');

const mongoose = require('mongoose');
const myFs = require('../config/myFs');
const request = require('request');

function calcAge(data) {
  const now = new Date();
  let age = now - data;
  age = Math.floor(age / 1000 / 60 / 60 / 24 / 365);
  return age;
}

function updateExperienceAddressGeocode(expId, address, apikey) {
  const options = {
    method: 'GET',
    url: 'https://maps.googleapis.com/maps/api/geocode/json',
    qs: {
      address,
      key: `${apikey}`,
      region: 'fr'
    },
  };

  // When geocode is complete, update experience
  request(options, (error, response, body) => {
    if (error) throw new Error(error);

    const data = JSON.parse(body);

    if (data.status === 'OK') {
      Experience.findById(expId, (err, exp) => {
        if (err) { console.err(err); }

        if (data.results !== undefined
          && data.results.length > 0
          && data.results[0].geometry !== undefined) {
          exp.meetingPointAddrLocation = data.results[0].geometry.location;
          exp.meetingPointAddrLocation.formatted_address = data.results[0].formatted_address;
        } else {
          exp.meetingPointAddrLocation = {};
        }

        // Save experience
        exp.save((err) => {
          if (err) console.error(err);
          console.info('geocoding Success!!');
        });
      });
    } else {
      console.error('Address not found!');

      Experience.findById(expId, (err, exp) => {
        if (err) { console.err(err); }

        exp.meetingPointAddrLocation = {};

        // Save experience
        exp.save((err) => {
          if (err) console.error(err);
          console.info('geocoding Success!!');
        });
      });
    }
  });
}

exports.checkCreateExperienceData = [
  check('inputTitle', 'Please chose a title (2 to 50 signs).').trim().isLength({ min: 2, max: 50 }),
  check('inputHook', 'Please chose a hook (2 to 200 signs).').trim().isLength({ min: 2, max: 200 }),
  check('expFree', 'Please specify if your experience is free or not.').trim().isIn(['true', 'false']),
  sanitize('expFree').toBoolean(),
  check('expChargeType', 'Please specify if your experience is charged by group or by traveller.').trim().custom((value, { req }) => {
    if (req.body.expFree === true) {
      return true;
    }
    if (value === undefined || value === null || value === '') return false;
    if (value !== 'group' && value !== 'traveller') return false;
    return true;
  }),
  check('inputAmountCharge', 'Please specify how much you want to charge for your experience, or chose the "free experience option" above.').trim().custom((value, { req }) => {
    if (req.body.expFree === true) {
      return true;
    }
    // Try to parse int
    const val = parseInt(value, 0);
    if (isNaN(val)) return false;
    if (val <= 0) return false;
    return true;
  }),
  sanitize('inputAmountCharge').toInt(),
  check('inputChargeReason', 'Please specify what will you use the revenues? (2 to 300 signs)').trim().custom((value, { req }) => {
    if (req.body.expFree === true) {
      return true;
    }
    if (value === undefined || value === null || value === '') return false;
    if (value.length < 2 || value.length >= 300) return false;
    return true;
  }),
  check('inputTravellerNbMin', 'Please specify how many travellers (of the same group) you can meet at once (you can chose one to eight).').trim().isInt({ min: 1, max: 8 }).custom((value, { req }) => {
    if (value > req.body.inputTravellerNbMax) throw new Error('Number of traveller minimum must be lower than number of traveller maximum.');
    return true;
  }),
  sanitize('inputTravellerNbMin').toInt(),
  check('inputTravellerNbMax', 'Please specify how many travellers (of the same group) you can meet at once (you can chose one to eight).').trim().isInt({ min: 1, max: 8 }),
  sanitize('inputTravellerNbMax').toInt(),
  check('inputDurationMin', 'Please specify how much hours your experience lasts (can be approximate).').trim().isFloat({ min: 1, max: 6 }).custom((value, { req }) => {
    if (value > req.body.inputDurationMax) throw new Error('Number of duration minimum must be lower than number of duration maximum.');
    return true;
  }),
  sanitize('inputDurationMin').toFloat(),
  check('inputDurationMax', 'Please specify how much hours your experience lasts (can be approximate).').trim().isFloat({ min: 1, max: 6 }),
  sanitize('inputDurationMax').toFloat(),
  check('inputDescription', 'Please write a description, so the travellers can fully understand what your experience is about. (200 to 2000 signs)').trim().isLength({ min: 200, max: 2000 }),
  check('inputIncluded', '"What is included" must be between 1 and 1000 characters.').trim().optional({ checkFalsy: true }).isLength({ min: 1, max: 1000 }),
  check('inputMeetingPointAddr', 'Please specify the meeting point address. (1 to 100 signs)').trim().isLength({ min: 1, max: 100 }),
  check('inputMeetingPointIndications', '"Meeting point indications" must be between 1 and 100 characters.').trim().optional({ checkFalsy: true }).isLength({ min: 1, max: 100 }),
  check('inputDontForget', '"Don\'t forget" must be between 1 and 1000 characters.').trim().optional({ checkFalsy: true }).isLength({ min: 1, max: 1000 }),
  check('tags', 'Please chose at least one hobby').trim().custom((value, { req }) => {
    if (req.body.tags != null && req.body.tags !== undefined && req.body.tags.length > 0) {
      return true;
    }
    return false;
  }),
];

/**
 * GET /
 * Create a new experience
 */
exports.getCreateExperience = (req, res) => {
  const exp = new Experience();
  exp._id = mongoose.Types.ObjectId();

  res.render('experience/create-experience', { title: 'Create a new experience', user: req.account, exp });
};

/**
 * POST /
 * Create a new experience
 */
exports.postCreateExperience = (req, res, next) => {
  const errors = validationResult(req);

  const exp = new Experience();
  exp._id = req.body.expId;

  if (!errors.isEmpty()) {
    return res.render('experience/create-experience', {
      title: 'Create a new experience',
      exp,
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
    Experience.findById(req.body.expId, (err, exp) => {
      if (err) { next(err); }

      // Experience not existe
      if (exp === undefined || exp === null) {
        exp = new Experience();
        exp._id = req.body.expId;
        exp.creator = req.account._id;
      }

      exp.title = req.body.inputTitle;
      exp.hook = req.body.inputHook;
      exp.isFree = req.body.expFree;

      if (exp.isFree) {
        exp.isChargeGroup = false;
        exp.isChargeTraveller = false;
        exp.amountCharge = '';
        exp.chargeReason = '';
      } else {
        if (req.body.expChargeType && req.body.expChargeType === 'traveller') {
          exp.isChargeGroup = false;
          exp.isChargeTraveller = true;
        } else if (req.body.expChargeType && req.body.expChargeType === 'group') {
          exp.isChargeGroup = true;
          exp.isChargeTraveller = false;
        }

        exp.amountCharge = req.body.inputAmountCharge;
        exp.chargeReason = req.body.inputChargeReason;
      }

      exp.travellerNbMin = req.body.inputTravellerNbMin;
      exp.travellerNbMax = req.body.inputTravellerNbMax;
      exp.durationMin = req.body.inputDurationMin;
      exp.durationMax = req.body.inputDurationMax;
      exp.description = req.body.inputDescription;
      exp.included = req.body.inputIncluded;
      exp.meetingPointAddr = req.body.inputMeetingPointAddr;
      // Geocode address
      if (exp.meetingPointAddr !== undefined && exp.meetingPointAddr !== null && exp.meetingPointAddr !== '') {
        updateExperienceAddressGeocode(
          req.body.expId, exp.meetingPointAddr,
          res.locals.googleApiGeocode
        );
      }
      exp.meetingPointIndications = req.body.inputMeetingPointIndications;
      exp.dontForget = req.body.inputDontForget;

      // Tags
      exp.interests = tagsId;

      exp.isCompleted = true;

      // Save experience
      exp.save((err) => {
        if (err) next(err);

        res.redirect(`/profile/${req.account._id}/experience`);
      });
    });
  });
};

/**
 * POST /
 * Upload experience cover images
 */
exports.postAddExperienceCover = (req, res, next) => {
  Experience.findById(req.body.exp_id, (err, exp) => {
    if (err) { next(err); }

    // Experience not existe
    if (exp === undefined || exp === null) {
      exp = new Experience();
      exp._id = req.body.exp_id;
      exp.creator = req.account._id;
    }

    // If number of cover pic > 5, return an error
    if (exp.coverPic !== undefined && exp.coverPic !== null && exp.coverPic.length >= 5) {
      myFs.deleteTmpUploadImg(req.files[0]);
      return res.json({
        success: 'false',
        error: 'Number of files for profile cover exceeds maximum allowed limit of 5.'
      });
    }

    // Déplacer les fichiers dans la destination
    myFs.moveExperienceCoverImg(exp._id, req.files[0])
      .then((result) => {
        const filePath = `/exp/${exp._id}/${result.newFileName}`;

        const id = mongoose.Types.ObjectId();
        exp.coverPic.push({
          picture: filePath,
          label: result.newFileName,
          _id: id
        });

        exp.save((err) => {
          if (err) return next(err);
          return res.json({
            success: 'true',
            initialPreview: [`../../..${filePath}`],
            initialPreviewConfig: [{
              caption: result.newFileName, width: '200px', url: req.body.edit_exp ? '/experience/edit/cover-upload/delete' : '/experience/create/cover-upload/delete', key: id
            }],
            append: true,
            fileUrl: filePath
          });
        });
      })
      .catch((err) => { next(err); });
  });
};

/**
 * POST /
 * Delete experience cover images
 */
exports.postDeleteExperienceCover = (req, res, next) => {
  Experience.findById(req.body.exp_id, (err, exp) => {
    if (err) { next(err); }

    const index = exp.coverPic.findIndex(item => item._id.equals(req.body.key));

    const deleteItem = exp.coverPic.splice(index, 1);

    myFs.deleteUploadImg(deleteItem)
      .then((msg) => { console.info(msg); })
      .catch((err) => { next(err); });

    exp.save((err) => {
      if (err) return next(err);
      return res.json({ success: 'true', key: req.body.key });
    });
  });
};

/**
 * GET /
 * Get edit experience
 */
exports.getEditExperience = (req, res, next) => {
  if (req.params.id) {
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      Experience.findById(req.params.id, (err, exp) => {
        if (err) next(err);

        if (exp === undefined || exp === null) next(new Error('Experience ID not found!'));

        let coverPicInitialPreview = '';
        let coverPicInitialPreviewConfig = '';

        if (exp.coverPic !== undefined && exp.coverPic.length > 0) {
          exp.coverPic.forEach((item) => {
            coverPicInitialPreview += `'${item.picture}',`;
            coverPicInitialPreviewConfig += `{caption: '${item.label}', width: '200px', url: '/experience/edit/cover-upload/delete', key: '${item._id}'},`;
          });
        }

        res.render('experience/edit-experience', {
          title: 'Edit experience', exp, coverPicInitialPreview, coverPicInitialPreviewConfig
        });
      }).populate({ path: 'interests', select: 'name _id', model: Tag });
    } else { next(new Error('Wrong ID!')); }
  } else {
    next(new Error('Id not found'));
  }
};

/**
 * POST /
 * Create a new experience
 */
exports.postEditExperience = (req, res, next) => {
  const errors = validationResult(req);

  const exp = new Experience();
  exp._id = req.body.expId;

  if (!errors.isEmpty()) {
    return res.render('experience/edit-experience', {
      title: 'Edit experience',
      exp,
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
    Experience.findById(req.body.expId, (err, exp) => {
      if (err) { next(err); }

      exp.title = req.body.inputTitle;
      exp.hook = req.body.inputHook;
      exp.isFree = req.body.expFree;

      if (exp.isFree) {
        exp.isChargeGroup = false;
        exp.isChargeTraveller = false;
        exp.amountCharge = '';
        exp.chargeReason = '';
      } else {
        if (req.body.expChargeType && req.body.expChargeType === 'traveller') {
          exp.isChargeGroup = false;
          exp.isChargeTraveller = true;
        } else if (req.body.expChargeType && req.body.expChargeType === 'group') {
          exp.isChargeGroup = true;
          exp.isChargeTraveller = false;
        }

        exp.amountCharge = req.body.inputAmountCharge;
        exp.chargeReason = req.body.inputChargeReason;
      }

      exp.travellerNbMin = req.body.inputTravellerNbMin;
      exp.travellerNbMax = req.body.inputTravellerNbMax;
      exp.durationMin = req.body.inputDurationMin;
      exp.durationMax = req.body.inputDurationMax;
      exp.description = req.body.inputDescription;
      exp.included = req.body.inputIncluded;
      exp.meetingPointAddr = req.body.inputMeetingPointAddr;
      // Geocode address
      if (exp.meetingPointAddr !== undefined && exp.meetingPointAddr !== null && exp.meetingPointAddr !== '') {
        updateExperienceAddressGeocode(
          req.body.expId, exp.meetingPointAddr,
          res.locals.googleApiGeocode
        );
      }
      exp.meetingPointIndications = req.body.inputMeetingPointIndications;
      exp.dontForget = req.body.inputDontForget;

      // Tags
      exp.interests = tagsId;

      exp.isCompleted = true;

      // Save experience
      exp.save((err) => {
        if (err) next(err);

        res.redirect(`/profile/${req.account._id}/experience`);
      });
    });
  });
};

/**
 * GET /
 * Get experience in read only
 */
exports.getExperience = (req, res, next) => {
  if (req.params.id) {
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      Experience.findById(req.params.id, (err, exp) => {
        if (err) next(err);

        if (exp === undefined || exp === null) next(new Error('Experience ID not found!'));

        const age = calcAge(exp.creator.profile.birthdate);
        const shortPresentationSentence = `${exp.creator.profile.adjective} ${age} years old traveller from ${exp.creator.profile.city}`;
        const genderAdv = exp.creator.profile.gender === 'man' ? 'He' : 'She';
        let i = 0;
        let spokenLanguages = '';
        if (exp.creator.profile.spokenLanguages &&
          Array.isArray(exp.creator.profile.spokenLanguages)) {
          exp.creator.profile.spokenLanguages.forEach((elem) => {
            if (i++ > 0) spokenLanguages += ' and ';
            spokenLanguages += elem.language;
          });
        }
        i = 0;
        let learningLanguages = '';
        if (exp.creator.profile.learningLanguages &&
          Array.isArray(exp.creator.profile.learningLanguages)) {
          exp.creator.profile.learningLanguages.forEach((elem) => {
            if (i++ > 0) learningLanguages += ' and ';
            learningLanguages += elem.language;
          });
        }

        let shortLearnSentence = `${genderAdv} speaks ${spokenLanguages}`;

        if (learningLanguages) { shortLearnSentence += `, and learns ${learningLanguages}`; }

        let recommendations = [];

        /** ***************** TEMP DATA => JUST FOR FRONT ************************** */
        recommendations = [{
          profilePic: '/images/sampleProfilePic1.png',
          displayName: 'Sam Gamji',
          city: 'Detroit',
          country: 'USA',
          titleExperience: 'My First experience',
          receiverDisplayName: '',
          comment: `User is really cool person, and smells good! An amazing time
        together for fucks sakes!`,
        },
        {
          profilePic: '/images/sampleProfilePic2.png',
          displayName: 'Xiu Lui',
          city: 'Taipei',
          country: 'Taiwan',
          titleExperience: '',
          receiverDisplayName: 'Thomasson',
          comment: `User is really cool person, and smells good! An amazing time
        together for fucks sakes! zadazd azd azd azdaz treg sdg sdg rtheth rtze r
        qfdf xcvdfvd gzerg zt e rfd xdgf dgerre zr se sfsdgdfg erg ertg zr e fsdf
         sdf tztzert zf zadazd azd azd azdaz treg sdg sdg rtheth rtze r qfdf
        xcvdfvd gzerg zt e rfd xdgf dgerre zr se sfsdgdfg erg ertg zr e fsdf sdf
        tztzert zf`,
          anwser: {
            profilePic: '/images/default-profile-pic.jpg',
            displayName: 'Thomasson',
            comment: `A pleasure amiga! We were realy lucky with the weather.
        fsdf sdf ez gsf dsfsd fqfqae fzeg sdfsdf srf erhdgfsdrfze hersef sf
        seqf e z gsdgsdf s ez ztzet sdfsdfg rgreteze z fdfs `
          }
        }];
        /** ***************** TEMP DATA => JUST FOR FRONT ************************** */

        res.render('experience/view-experience', {
          title: 'View experience', exp, shortPresentationSentence, shortLearnSentence, recommendations
        });
      })
        .populate({ path: 'interests', select: 'name _id', model: Tag })
        .populate({ path: 'creator', select: '_id profile.birthdate profile.adjective profile.city profile.gender profile.spokenLanguages profile.learningLanguages profile.nickName profile.firstName', model: User });
    } else { next(new Error('Wrong ID!')); }
  } else {
    next(new Error('Id not found'));
  }
};


/**
 * GET /
 * Get experiences list
 */
exports.getExperienceList = (req, res, next) => {
  Experience
    .find({})
    .sort({ createdAt: -1 })
    .select({
      _id: 1, creator: 1, coverPic: 1, title: 1, isFree: 1, nbRecommendation: 1
    })
    .populate({ path: 'interests', select: 'name _id', model: Interest })
    .populate({ path: 'creator', select: 'profile.profilePic profile.firstName profile.nickName', model: User })
    .exec((err, exps) => {
      if (err) { next(err); }

      res.render('experience/experience-list', { title: 'Experience list', exps });
    });
};
