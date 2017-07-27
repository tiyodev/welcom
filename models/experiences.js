const mongoose = require('mongoose');
const User = require('../models/users');
const Interest = require('../models/interests');
require('mongoose-double')(mongoose);

const SchemaTypes = mongoose.Schema.Types;
const Schema = mongoose.Schema;

const experienceSchema = new mongoose.Schema({
  title: { type: String, maxlength: 50 },
  creator: { type: Schema.ObjectId, ref: 'User' },
  creatorName: String,
  creatorPicture: String,
  creatorAge: Number,
  creatorGender: String,
  createdDate: Date,
  teaser: { type: String, maxlength: 100 },
  description: { type: String, maxlength: 1200 },
  memo: { type: String, maxlength: 140 },
  /*
  zone: [{
    name: String,
    coordinate: [{
      longitude: SchemaTypes.Double,
      latitude: SchemaTypes.Double
    }]
  }],
  */
  zone: String,
  place: String,
  city: { type: String, maxlength: 64 },
  country: { type: String, maxlength: 64 },
  homePicture: String,
  interests: [{ type: Schema.ObjectId, ref: 'Interest' }],
  languages: [{ type: String, maxlength: 2 }],
  durationInHours: Number,
  //price: SchemaTypes.Double,
  price: Number,
  pricePerUser: { type: Boolean, default: false },
  handicapAccess: { type: Boolean, default: false },
  maxUser: Number,
  minUser: Number,
  searchRate: { type: Number, default: 0 },
  searchCoefficient: { type: Number, default: 0 },
  countBooking: { type: Number, default: 0 },
  date: Date,
  time: String,
  isComplete: { type: Boolean, default: false },
  isActive: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  tip: Number,
  experienceState: String,
  gallery: [{
    label: String,
    picture: String
  }],
  travelers: [{
    id: mongoose.Schema.ObjectId,
    name: String
  }],
  numberTravelers: Number,
  translations: [{
    countryCode: String,
    title: { type: String, maxlength: 50 },
    teaser: { type: String, maxlength: 140 },
    description: { type: String, maxlength: 1200 },
    memo: { type: String, maxlength: 140 },
  }],
  /* Reviews */
  nbReviewsReceive: { type: Number, default: 0 },
  globalRate: { type: Number, default: 0, min: 0, max: 5 },
  reviews: [{
    User: { type: Schema.ObjectId, ref: 'User' },
    rate: { type: Number, default: 0, min: 0, max: 5 },
    comment: String,
    date: Date
  }],
}, { timestamps: true });

const Experience = mongoose.model('Experience', experienceSchema);

module.exports = Experience;