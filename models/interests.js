const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const interestSchema = new Schema({
  name: { type: String, default: '' },
  illustration: { type: String, default: '' },
}, { timestamps: true });

const Interest = mongoose.model('Interest', interestSchema);

module.exports = Interest;
