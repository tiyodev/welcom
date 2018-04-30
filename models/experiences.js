const mongoose = require('mongoose');
const user = require('../models/users');
const interest = require('../models/interests');

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
}, { timestamps: true });

const Experience = mongoose.model('Experience', experienceSchema);

module.exports = Experience;
