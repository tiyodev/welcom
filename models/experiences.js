const mongoose = require('mongoose');
const user = require('../models/users');
const interest = require('../models/interests');
const recommendation = require('../models/recommendations');

const Schema = mongoose.Schema;

const experienceSchema = new Schema({
  coverPic: [{
    label: String,
    picture: String
  }],
  title: { type: String, default: '' },
  hook: { type: String, default: '' },
  interests: [{ type: Schema.ObjectId, ref: 'interest' }],
  isFree: { type: Boolean, default: true },
  isChargeGroup: { type: Boolean, default: false },
  isChargeTraveller: { type: Boolean, default: false },
  amountCharge: { type: Number, default: 0 },
  chargeReason: { type: String, default: '' },
  travellerNbMin: { type: Number, default: 0 },
  travellerNbMax: { type: Number, default: 0 },
  durationMin: { type: Number, default: 0 },
  durationMax: { type: Number, default: 0 },
  description: { type: String, default: '' },
  included: { type: String, default: '' },
  meetingPointAddr: { type: String, default: '' },
  meetingPointAddrLocation: {
    formatted_address: { type: String, default: null },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
  },
  meetingPointIndications: { type: String, default: '' },
  dontForget: { type: String, default: '' },
  creator: { type: Schema.ObjectId, ref: 'user' },
  isCompleted: { type: Boolean, default: false },
  nbRecommendation: { type: Number, default: 0 },
  recommendations: [{ type: Schema.ObjectId, ref: 'recommendation' }]
}, { timestamps: true });

/**
 * @function
 * @name createNewExperience
 * @desc Create new experience instance with a new ID and initialize creator
 * @param {Object} creatorId - Object id of creator (user)
 * @returns {Promise} Promise returning a new instance of experience
 */
experienceSchema.static('createNewExperienceInstance', function(creatorId, expId = null){
  return new Promise((resolve, reject) => {
    try{
      const exp = new Experience();
      exp._id = expId || mongoose.Types.ObjectId();
      exp.creator = creatorId;
      resolve(exp);
    } catch(err){
      reject(err);
    }
  });
});

/**
 * @function
 * @name findByIdAndPopulateInterestCreatorRecommendation
 * @desc Find experience by id and populate Interests, Creator and Recommendations
 * @param {Object} experienceId - Object id of experience
 * @returns {Promise} Promise returning an experience object
 */
experienceSchema.static('findByIdAndPopulateInterestCreatorRecommendation', function(experienceId){
  return new Promise(async (resolve, reject) => {
    try{
      const exp = await Experience.findById(experienceId)
        .populate({ 
          path: 'interests', 
          select: 'name _id', 
          model: interest })
        .populate({ 
          path: 'creator', 
          select: '_id profile.birthdate profile.adjective profile.city profile.gender profile.spokenLanguages profile.learningLanguages profile.nickName profile.firstName', 
          model: user })
        .populate({ 
          path: 'recommendations',
          model: recommendation, 
          populate: { 
            path: 'writer', 
            select: '_id profile.nickName profile.firstName profile.city profile.profilePic', 
            model: user
          }
        });

      resolve(exp);
    } catch(err){
      reject(err);
    }
  });
});

/**
 * @function
 * @name findByIdAndPopulateInterest
 * @desc Find experience by id and populate Interests
 * @param {Object} experienceId - Object id of experience
 * @returns {Promise} Promise returning an experience object
 */
experienceSchema.static('findByIdAndPopulateInterest', function(experienceId){
  return new Promise(async (resolve, reject) => {
    try{
      const exp = await Experience.findById(experienceId)
        .populate({ 
          path: 'interests', 
          select: 'name _id', 
          model: interest 
        });

      resolve(exp);
    } catch(err){
      reject(err);
    }
  });
});

/**
 * @function
 * @name getExperienceListPopulateInterestCreator
 * @desc Find a list of experiences
 * @returns {Promise} Promise returning an array of experience
 */
experienceSchema.static('getExperienceListPopulateInterestCreator', function(){
  return new Promise(async (resolve, reject) => {
    try{
      const exps = await Experience
        .find({})
        .sort({ createdAt: -1 })
        .select({
          _id: 1, 
          creator: 1, 
          coverPic: 1, 
          title: 1, 
          isFree: 1, 
          nbRecommendation: 1
        })
        .populate({ 
          path: 'interests', 
          select: 'name _id', 
          model: interest 
        })
        .populate({ 
          path: 'creator', 
          select: 'profile.profilePic profile.firstName profile.nickName', 
          model: user 
        });

      resolve(exps);
    } catch(err){
      reject(err);
    }
  });
});

/**
 * @function
 * @name isValidObjectId
 * @desc Test if the objectId is valid
 * @returns {Boolean} true if objectId is valid else return false
 */
experienceSchema.static('isValidObjectId', function(objectId){
  return mongoose.Types.ObjectId.isValid(objectId);
});

/**
 * @function
 * @name generateNewObjectId
 * @desc Generate a new objectId
 * @returns {Object} objectId
 */
experienceSchema.static('generateNewObjectId', function(){
  return mongoose.Types.ObjectId();
});


const Experience = mongoose.model('Experience', experienceSchema);

module.exports = Experience;
