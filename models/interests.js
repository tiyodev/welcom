const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const interestSchema = new Schema({
  name: { type: String, default: '' },
}, { timestamps: true });

/**
 * @function
 * @name isValidObjectId
 * @desc Test if the objectId is valid
 * @returns {Boolean} true if objectId is valid else return false
 */
interestSchema.static('isValidObjectId', function(objectId){
  return mongoose.Types.ObjectId.isValid(objectId);
});

/**
 * @function
 * @name generateNewObjectId
 * @desc Generate a new objectId
 * @returns {Object} objectId
 */
interestSchema.static('generateNewObjectId', function(){
  return mongoose.Types.ObjectId();
});

const Interest = mongoose.model('Interest', interestSchema);

module.exports = Interest;
