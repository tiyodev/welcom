const mongoose = require('mongoose');
const user = require('../models/users');

const Schema = mongoose.Schema;

const recommendationSchema = new Schema({
  isForProfile: { type: Boolean, default: false },
  isForExperience: { type: Boolean, default: false },
  description: String,
  writer: { type: Schema.ObjectId, ref: 'user' },
  receiver: { type: Schema.ObjectId, ref: 'user' },
  response: {
    description: String,
    responseDate: { type: Date }
  }
}, { timestamps: true });

/**
 * @function
 * @name isValidObjectId
 * @desc Test if the objectId is valid
 * @returns {Boolean} return true if objectId is valid else return false
 */
recommendationSchema.static('isValidObjectId', function(objectId){
  return mongoose.Types.ObjectId.isValid(objectId);
});

/**
 * @function
 * @name generateNewObjectId
 * @desc Generate a new objectId
 * @returns {Object} return objectId
 */
recommendationSchema.static('generateNewObjectId', function(){
  return mongoose.Types.ObjectId();
});

const Recommendation = mongoose.model('Recommendation', recommendationSchema);

module.exports = Recommendation;
