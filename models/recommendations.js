const mongoose = require('mongoose');
const user = require('../models/users');

const Schema = mongoose.Schema;

const recommendationSchema = new Schema({
  isForProfile: { type: Boolean, default: false },
  isForExperience: { type: Boolean, default: false },
  type: { type: String, enum: ['yes', 'no','dontKnow'] },
  description: String,
  writer: { type: Schema.ObjectId, ref: 'user' },
  receiver: { type: Schema.ObjectId, ref: 'user' },
  response: {
    description: String,
    responseDate: { type: Date }
  }
}, { timestamps: true });

const Recommendation = mongoose.model('Recommendation', recommendationSchema);

module.exports = Recommendation;
