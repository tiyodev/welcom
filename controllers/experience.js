const Experience = require('./../models/experiences');
const Tag = require('./../models/interests');
const Recommendations = require('./../models/recommendations');

const { check, validationResult } = require('express-validator/check');
const { sanitize, matchedData } = require('express-validator/filter');

const myFs = require('../utils/myFs');
const utils = require('../utils/utils');

/**
 * @name checkExperienceData
 * @desc Array of rules to check experience form inputs values
 */
exports.checkExperienceData = [
  check('inputTitle', 'Please chose a title (2 to 50 signs).').trim().isLength({ min: 2, max: 50 }),
  check('inputHook', 'Please chose a hook (2 to 200 signs).').trim().isLength({ min: 2, max: 200 }),
  check('expFree', 'Please specify if your experience is free or not.').trim().isIn(['true', 'false']),
  sanitize('expFree').toBoolean(),
  check('expChargeType', 'Please specify if your experience is charged by group or by traveller.').trim().custom((value, { req }) => {
    if (req.body.expFree === true)
      return true;
    if (value === undefined || value === null || value === '') return false;
    if (value !== 'group' && value !== 'traveller') return false;
    return true;
  }),
  check('inputAmountCharge', 'Please specify how much you want to charge for your experience, or chose the "free experience option" above.').trim().custom((value, { req }) => {
    if (req.body.expFree === true)
      return true;
    // Try to parse int
    const val = parseInt(value, 0);
    if (isNaN(val)) return false;
    if (val <= 0) return false;
    return true;
  }),
  sanitize('inputAmountCharge').toInt(),
  check('inputChargeReason', 'Please specify what will you use the revenues? (2 to 300 signs)').trim().custom((value, { req }) => {
    if (req.body.expFree === true)
      return true;
    if (value === undefined || value === null || value === '') return false;
    if (value.length < 2 || value.length >= 300) return false;
    return true;
  }),
  check('inputTravellerNbMin', 'Please specify how many travellers (of the same group) you can meet at once (you can chose one to eight).').trim().isInt({ min: 1, max: 8 }).custom((value, { req }) => {
    if (value > req.body.inputTravellerNbMax) 
      throw new Error('Number of traveller minimum must be lower than number of traveller maximum.');
    return true;
  }),
  sanitize('inputTravellerNbMin').toInt(),
  check('inputTravellerNbMax', 'Please specify how many travellers (of the same group) you can meet at once (you can chose one to eight).').trim().isInt({ min: 1, max: 8 }),
  sanitize('inputTravellerNbMax').toInt(),
  check('inputDurationMin', 'Please specify how much hours your experience lasts (can be approximate).').trim().isFloat({ min: 1, max: 6 }).custom((value, { req }) => {
    if (value > req.body.inputDurationMax) 
      throw new Error('Number of duration minimum must be lower than number of duration maximum.');
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
    if (req.body.tags != null && req.body.tags !== undefined && req.body.tags.length > 0)
      return true;
    return false;
  }),
];

/**
 * @name checkRecommendationData
 * @desc Array of rules to check recommendation form inputs values
 */
exports.checkRecommendationData = [
  check('recommendationDesc', 'Please, write a recommendations (30 to 300 signs).').trim().isLength({ min: 30, max: 300 })
];

/**
 * @name checkBookAnExpData
 * @desc Array of rules to check booking form inputs values
 */
exports.checkBookAnExpData = [
  sanitize('inputBookingDate').toDate(),
  check('inputBookingDate', 'Please select a correct date.').isISO8601().isAfter(),
  sanitize('inputBookingNbTravellers').toInt(),
  check('inputBookingNbTravellers', 'Please specify how many travellers you are.').trim().isInt({ min: 1, max: 8 }),
  check('inputBookingMessage', 'Please, write a message (2 to 500 signs).').trim().isLength({ min: 2, max: 500 })
];

/**
 * @function
 * @name findOrCreateTags
 * @desc Get tag or create a new tag if it dosen't exist
 * @param {Array<String>} tags - Array of tags name
 * @returns {Array<String>} Array of tags objectId
 */
function findOrCreateTags(tags){
  // Get a promises array, one by tag
  return tags.map(async (tag) => {
    if (tag === undefined || tag === null || tag === '')
      return;
    
    try {
      const findTag = await Tag.findOne({ name: tag });

      // If the tag already exist, return tag id.
      if (findTag !== null) 
        return findTag._id;

      // Create a new tag
      const newTag = new Tag();
      newTag.name = tag;
      newTag._id = Tag.generateNewObjectId();

      // Save new tag
      await newTag.save();

      return newTag._id;
    } catch (err) {
      console.error('findOrCreateTags', 'Cannot find or create tag');
      return;
    }
  });
}

/**
 * @function
 * @name updateExpData
 * @desc Update experience with form data
 * @param {Object} data - Form data
 * @param {Object} exp - Experience
 * @param {String} googleApiGeocode - Google geocode api key
 * @returns {Object} Experience with new data
 */
function updateExpData(data, exp, googleApiGeocode){
  return new Promise(async (resolve, reject) => {
    try{
      // Update experience
      let tagsId = [];
      if(data.tags)
        tagsId = await Promise.all(findOrCreateTags(data.tags));

      exp.title = data.inputTitle;
      exp.hook = data.inputHook;
      exp.isFree = data.expFree;

      exp.amountCharge = exp.isFree ? '' : data.inputAmountCharge;
      exp.chargeReason = exp.isFree ? '' : data.inputChargeReason;
      exp.isChargeGroup = (!exp.isFree && data.expChargeType && data.expChargeType === 'group') ? true : false;
      exp.isChargeTraveller = (!exp.isFree && data.expChargeType && data.expChargeType === 'traveller' ) ? true : false;

      exp.travellerNbMin = data.inputTravellerNbMin;
      exp.travellerNbMax = data.inputTravellerNbMax;
      exp.durationMin = data.inputDurationMin;
      exp.durationMax = data.inputDurationMax;
      exp.description = data.inputDescription;
      exp.included = data.inputIncluded;
      exp.meetingPointAddr = data.inputMeetingPointAddr;

      exp.meetingPointIndications = data.inputMeetingPointIndications;
      exp.dontForget = data.inputDontForget;

      exp.interests = tagsId;
      exp.isCompleted = true;

      // Geocode address
      let location = {};
      if (exp.meetingPointAddr !== undefined && exp.meetingPointAddr !== null && exp.meetingPointAddr !== '') 
        location = await utils.geocodeAddress(exp.meetingPointAddr, googleApiGeocode);
        
      exp.meetingPointAddrLocation = location;

      resolve(exp);
    } catch(err){
      reject(err);
    }
  }); 
}

/**
 * @function
 * @name generateDynamicSentencesForExp
 * @desc Generate dynamic sentences with experience information
 * @param {Object} exp - Experience data
 * @returns {Object} Dynamic sentences
 */
function generateDynamicSentencesForExp(exp) {
  return new Promise((resolve, reject) => {
    try{
      // Calculates age based on date
      const age = utils.calcAge(exp.creator.profile.birthdate);

      // Create a short presentation sentence
      const shortPresentationSentence = `${exp.creator.profile.adjective} ${age} years old traveller from ${exp.creator.profile.city}`;

      // Get the gender adverb
      const genderAdv = exp.creator.profile.gender === 'man' ? 'He' : 'She';

      // Create a piece of a sentence with all spoken languages    
      let i = 0;
      let spokenLanguages = '';
      if (exp.creator.profile.spokenLanguages && Array.isArray(exp.creator.profile.spokenLanguages)) {
        exp.creator.profile.spokenLanguages.forEach((elem) => {
          if (i++ > 0) spokenLanguages += ' and ';
          spokenLanguages += elem.language;
        });
      }

      // Create a piece of a sentence with all learning languages  
      i = 0;
      let learningLanguages = '';
      if (exp.creator.profile.learningLanguages && Array.isArray(exp.creator.profile.learningLanguages)) {
        exp.creator.profile.learningLanguages.forEach((elem) => {
          if (i++ > 0) learningLanguages += ' and ';
          learningLanguages += elem.language;
        });
      }

      // Add gender adverb and spoken languages to the final sentence
      let shortLearnSentence = `${genderAdv} speaks ${spokenLanguages}`;

      // Add learning languages to the final sentence
      if (learningLanguages) { shortLearnSentence += `, and learns ${learningLanguages}`; }

      resolve({
        shortPresentationSentence, 
        shortLearnSentence
      });
    } catch(err){
      reject(err);
    }
  });
}

/**
 * HTTP GET
 * @function
 * @name getExperience
 * @desc Get experience in read only
 * @param {Object} req - HTTP request argument to the middleware function, conventionally called "req".
 * @param {Object} res - HTTP response argument to the middleware function, conventionally called "res".
 * @param {Function} next - Reminder argument to the middleware function, called "next" by convention.
 * @returns {View} View experience page
 */
exports.getExperience = async (req, res, next) => {
  // If the id is not found in the url parameters
  if (!req.params.id)
    next(new Error('Id not found'));

  // If the id is not correct
  if(!Experience.isValidObjectId(req.params.id))
    next(new Error('Wrong ID!'));

  try{

    // Get experience by id, populate interests, creator and recommendations
    const exp = await Experience.findByIdAndPopulateInterestCreatorRecommendation(req.params.id);

    // Get general data of the experience (generate sentence)
    const data = await generateDynamicSentencesForExp(exp);

    // Return view experience page
    res.render('experience/view-experience', {
      title: 'View experience', 
      exp, 
      shortPresentationSentence: data.shortPresentationSentence, 
      shortLearnSentence: data.shortLearnSentence
    });
    
  } catch(err){
    next(err);
  }
};

/**
 * HTTP GET
 * @function
 * @name getExperienceList
 * @desc Get a list with all experiences
 * @param {Object} req - HTTP request argument to the middleware function, conventionally called "req".
 * @param {Object} res - HTTP response argument to the middleware function, conventionally called "res".
 * @param {Function} next - Reminder argument to the middleware function, called "next" by convention.
 * @returns {View} Page with all experiences cards
 */
exports.getExperienceList = async (req, res, next) => {
  const exps = await Experience.getExperienceListPopulateInterestCreator();

  // Return the page with all experiences cards
  res.render('experience/experience-list', { title: 'Experience list', exps });
};

/**
 * HTTP GET
 * @function
 * @name getCreateExperience
 * @desc Create a new experience instance and return create experience form
 * @param {Object} req - HTTP request argument to the middleware function, conventionally called "req".
 * @param {Object} res - HTTP response argument to the middleware function, conventionally called "res".
 * @returns {View} Experience creation page
 */
exports.getCreateExperience = async (req, res) => {
  // Create a new instance of experience
  const exp = await Experience.createNewExperienceInstance(req.account._id);
  // Save experience
  await exp.save();
  res.render('experience/create-experience', { title: 'Create a new experience', user: req.account, exp });
};

/**
 * HTTP POST
 * @function
 * @name postCreateExperience
 * @desc Create a new experience
 * @param {Object} req - HTTP request argument to the middleware function, conventionally called "req".
 * @param {Object} res - HTTP response argument to the middleware function, conventionally called "res".
 * @param {Function} next - Reminder argument to the middleware function, called "next" by convention.
 * @returns {View} Redirect to view experience page
 */
exports.postCreateExperience = async (req, res, next) => {
  const errors = validationResult(req);

  try{
    // Get experience
    let exp = await Experience.findById(req.body.expId);

    // If experience is null, create and initialize new experience 
    if (exp === undefined || exp === null)
      exp = await Experience.createNewExperienceInstance(req.account._id, req.body.expId);

    // If there are errors in the form, return create experience form with errors
    if (!errors.isEmpty()) {
      return res.render('experience/create-experience', {
        title: 'Create a new experience',
        exp,
        errors: errors.array(),
        validData: matchedData(req)
      });
    }

    // Update experience
    exp = await updateExpData(req.body, exp, res.locals.googleApiGeocode);

    // Save experience
    await exp.save();

    // Redirect to the view experience page
    res.redirect(`/profile/${req.account._id}/experience`);

  } catch(err){
    next(err);
  }
};

/**
 * HTTP GET
 * @function
 * @name getEditExperience
 * @desc Get edit form of experience
 * @param {Object} req - HTTP request argument to the middleware function, conventionally called "req".
 * @param {Object} res - HTTP response argument to the middleware function, conventionally called "res".
 * @param {Function} next - Reminder argument to the middleware function, called "next" by convention.
 * @returns {View} Experience editing page with initialized fields
 */
exports.getEditExperience = async (req, res, next) => {
  // If the id is not found in the url parameters
  if (!req.params.id)
    next(new Error('Id not found'));

  // If the id is not correct
  if(!Experience.isValidObjectId(req.params.id))
    next(new Error('Wrong ID!'));

  try{
    // Get experience
    const exp = await Experience.findByIdAndPopulateInterest(req.params.id);

    // Initialize data
    let coverPicInitialPreview = '';
    let coverPicInitialPreviewConfig = '';

    // Create initial preview data for all images
    if (exp.coverPic !== undefined && exp.coverPic.length > 0) {
      exp.coverPic.forEach((item) => {
        coverPicInitialPreview += `'${item.picture}',`;
        coverPicInitialPreviewConfig += `{caption: '${item.label}', width: '200px', url: '/experience/edit/cover-upload/delete', key: '${item._id}'},`;
      });
    }

    // Return edit experience form
    res.render('experience/edit-experience', {
      title: 'Edit experience', exp, coverPicInitialPreview, coverPicInitialPreviewConfig
    });

  } catch(err){
    next(err);
  }
};

/**
 * HTTP POST
 * @function
 * @name postEditExperience
 * @desc Edit experience
 * @param {Object} req - HTTP request argument to the middleware function, conventionally called "req".
 * @param {Object} res - HTTP response argument to the middleware function, conventionally called "res".
 * @param {Function} next - Reminder argument to the middleware function, called "next" by convention.
 * @returns {View} Redirect to view experience page
 */
exports.postEditExperience = async (req, res, next) => {
  const errors = validationResult(req);

  try{
    // Get experience
    let exp = await Experience.findByIdAndPopulateInterest(req.body.expId);

    // If experience is null, create and initialize new experience 
    if (exp === undefined || exp === null)
      exp = await Experience.createNewExperienceInstance(req.account._id, req.body.expId);

    // If there are errors in the form, return create experience form with errors
    if (!errors.isEmpty()) {
      return res.render('experience/edit-experience', {
        title: 'Edit experience',
        exp,
        errors: errors.array(),
        validData: matchedData(req)
      });
    }
    
    // Update experience
    exp = await updateExpData(req.body, exp, res.locals.googleApiGeocode);

    // // Save experience
    await exp.save();

    // Redirect to the view experience page
    res.redirect(`/profile/${req.account._id}/experience`);

  } catch(err){
    next(err);
  }
};

/**
 * HTTP POST
 * @function
 * @name postAddExperienceCover
 * @desc Upload a new experience cover
 * @param {Object} req - HTTP request argument to the middleware function, conventionally called "req".
 * @param {Object} res - HTTP response argument to the middleware function, conventionally called "res".
 * @returns {Json} Return json object with cover data and success or error  
 */
exports.postAddExperienceCover = async (req, res) => {
  try{
    // Get experience
    let exp = await Experience.findById(req.body.exp_id);

    // If experience is null, create and initialize new experience 
    if (exp === undefined || exp === null)
      exp = await Experience.createNewExperienceInstance(req.account._id, req.body.exp_id);

    // If coverPic is null or number of cover pic > 5, return an error
    if (exp.coverPic !== undefined && exp.coverPic !== null && exp.coverPic.length >= 5) {
      // Delete temporary images
      myFs.deleteTmpUploadImg(req.files[0]);
      // Return json error
      return res.json({
        success: 'false',
        error: 'Number of files for profile cover exceeds maximum allowed limit of 5.'
      });
    }

    // Move images in the final destination folder
    const image = await myFs.moveExperienceCoverImg(exp._id, req.files[0]);

    // Generate image path
    const filePath = `/exp/${exp._id}/${image.newFileName}`;

    // Add new image in the image array of the experience
    const imgId = Experience.generateNewObjectId();
    exp.coverPic.push({
      picture: filePath,
      label: image.newFileName,
      _id: imgId
    });

    // Save experience
    await exp.save();

    // Return Json with all image informations
    return res.json({
      success: 'true',
      initialPreview: [`../../..${filePath}`],
      initialPreviewConfig: [{
        caption: image.newFileName, width: '200px', url: req.body.edit_exp ? '/experience/edit/cover-upload/delete' : '/experience/create/cover-upload/delete', key: imgId
      }],
      append: true,
      fileUrl: filePath
    });

  } catch(err){
    // Return json error
    return res.json({
      success: 'false',
      error: JSON.stringify(err)
    });
  }
};

/**
 * HTTP POST
 * @function
 * @name postDeleteExperienceCover
 * @desc Delete experience cover
 * @param {Object} req - HTTP request argument to the middleware function, conventionally called "req".
 * @param {Object} res - HTTP response argument to the middleware function, conventionally called "res".
 * @returns {Json} Return json object with cover key and success or error  
 */
exports.postDeleteExperienceCover = async (req, res) => {
  try{
    // Get experience
    const exp = await Experience.findById(req.body.exp_id);

    // Get the index of the image in the array
    const index = exp.coverPic.findIndex(item => item._id.equals(req.body.key));

    // Deletes the image from the array 
    const deleteItem = exp.coverPic.splice(index, 1);

    // Save experience
    await exp.save();

    // Delete image from the folder.
    await myFs.deleteUploadImg(deleteItem)

    // Return Success Json
    return res.json({ 
      success: 'true', 
      key: req.body.key 
    });

  } catch(err){
    // Return json error
    return res.json({
      success: 'false',
      error: JSON.stringify(err),
      key: req.body.key
    });
  }
};

/**
 * HTTP POST
 * @function
 * @name postRecommendation
 * @desc Add a new recommendation
 * @param {Object} req - HTTP request argument to the middleware function, conventionally called "req".
 * @param {Object} res - HTTP response argument to the middleware function, conventionally called "res".
 * @param {Function} next - Reminder argument to the middleware function, called "next" by convention.
 * @returns {View} Redirect to view experience page
 */
exports.postRecommendation = async (req, res, next) => {
  // If the id is not found in the url parameters
  if (!req.params.id)
    next(new Error('Id not found'));

  // If the id is not correct
  if(!Experience.isValidObjectId(req.params.id))
    next(new Error('Wrong ID!'));

  try{
    // Get experience by id, populate interests, creator and recommendations
    const exp = await Experience.findByIdAndPopulateInterestCreatorRecommendation(req.params.id);

    // If there are input errors in the form
    if (!errors.isEmpty()) {
      // Get general data of the experience (generate sentence)
      const data = await generateDynamicSentencesForExp(exp);

      // Return the form with all informations
      res.render('experience/view-experience', {
        title: 'View experience', 
        exp, 
        shortPresentationSentence: data.shortPresentationSentence, 
        shortLearnSentence: data.shortLearnSentence,
        errors: errors.array(),
        validData: matchedData(req),
        isFromAddRecommendation: true
      });
    }

    // Create new recommendation
    const newRecommendation = new Recommendations();
    newRecommendation._id = Recommendations.generateNewObjectId();
    newRecommendation.isForProfile = false;
    newRecommendation.isForExperience = true;
    newRecommendation.description = req.body.recommendationDesc;
    newRecommendation.writer = req.account._id;

    // Save new recommendation
    newRecommendation = await newRecommendation.save();

    // Initialize array if recommendations array is null
    if(exp.recommendations === undefined || exp.recommendations === null)
      exp.recommendations = [];

    // Push new recommendation to the array in the experience document
    exp.recommendations.push(newRecommendation._id);

    // Save experience
    await exp.save();

    // Return to the experience view page
    res.redirect(`/experience/${exp._id}`)

  } catch(err){
    next(err);
  }
};

/**
 * HTTP POST
 * @function
 * @name postBookAnExp
 * @desc Book an experience
 * @param {Object} req - HTTP request argument to the middleware function, conventionally called "req".
 * @param {Object} res - HTTP response argument to the middleware function, conventionally called "res".
 * @param {Function} next - Reminder argument to the middleware function, called "next" by convention.
 * @returns {View} Profile dashboard page
 */
exports.postBookAnExp = async (req, res, next) => {
  // If the id is not found in the url parameters
  if (!req.params.id)
    next(new Error('Id not found'));

  // If the id is not correct
  if(!Experience.isValidObjectId(req.params.id))
    next(new Error('Wrong ID!'));

  try{
    // Get experience by id, populate interests, creator and recommendations
    const exp = await Experience.findByIdAndPopulateInterestCreatorRecommendation(req.params.id);

    // If there are input errors in the form
    if (!errors.isEmpty()) {
      // Get general data of the experience (generate sentence)
      const data = await generateDynamicSentencesForExp(exp);

      // Return the form with all informations
      res.render('experience/view-experience', {
        title: 'View experience', 
        exp, 
        shortPresentationSentence: data.shortPresentationSentence, 
        shortLearnSentence: data.shortLearnSentence,
        errors: errors.array(),
        validData: matchedData(req),
        isFromBookingRequest: true
      });
    }

    // Create booking request

  } catch(err){
    next(err);
  }
}