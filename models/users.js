const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
const mongoose = require('mongoose');
const interest = require('../models/interests');
const experience = require('../models/experiences');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  /* General */
  registrationDate: Date,
  isActive: { type: Boolean, default: true },
  isAdmin: { type: Boolean, default: false },
  isWelcomer: { type: Boolean, default: false },
  /* Email */
  email: { type: String, unique: true, maxlength: 254 },
  newEmail: { type: String, maxlength: 254 },
  validEmail: { type: Boolean, default: false },
  validEmailToken: String,
  validEmailTokenExpires: Date,
  lastChangeEmail: Date,
  numberChangeEmail: { type: Number, default: 0 },
  sendMailEachPM: { type: Boolean, default: true },
  /* Password */
  password: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  /* OAuth */
  twitter: String,
  google: String,
  facebook: String,
  tokens: Array,
  /* Profile */
  profile: {
    /* User info */
    birthdate: Date,
    yearsOld: { type: String, default: '' },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    pseudonyme: { type: String, default: '' },
    gender: { type: String, enum: ['m', 'f'] },
    description: { type: String, default: '' },
    phoneNumber: { type: String, default: '' },
    status: { type: String, default: '' },
    /* Tag */
    interests: [{ type: Schema.ObjectId, ref: 'interest' }],
    tagAdded: { type: Number, default: 0 },
    /* Location */
    city: { type: String, default: '' },
    country: { type: String, default: '' },
    location: { type: String, default: '' },
    postCode: { type: String, default: '' },
    /* Picture */
    picture: String,
    cover: String,
    /* Message */
    msgSent: { type: Number, default: 0 },
    lastMsgSent: Date,
    /* Experience */
    expBooked: [{
      expId: { type: String, ref: 'experience' },
    }],
    expBooking: { type: Number, default: 0 },
    lastExpBooking: Date,
    /* Search info */
    searchRate: { type: Number, default: 0 },
    searchCoefficient: { type: Number, default: 0 },
    /* Social galaxy */
    socialGalaxy: [{
      name: String,
      link: { type: String, default: '' },
      picture: { type: String, default: '' }
    }],
    /* Languages */
    spokenLanguages: [{
      language: String,
      shortLanguage: String,
      level: { type: String, enum: ['debutant', 'confirmé', 'expert'] },
    }],
    /* Milestones */
    milestones: [{
      description: String,
      startMonth: Number,
      startYear: Number,
      endMonth: Number,
      endYear: Number,
      _id: { type: Schema.ObjectId }
    }],
    /* Reviews */
    nbReviewDone: { type: Number, default: 0 },
    nbReviewsReceive: { type: Number, default: 0 },
    globalRate: { type: Number, default: 0, min: 0, max: 5 },
    reviews: [{
      User: { type: Schema.ObjectId, ref: 'user' },
      rate: { type: Number, default: 0, min: 0, max: 5 },
      comment: String,
      date: Date
    }],
    userRate: { type: Number, default: 0, min: 0, max: 5 },
    sharingSpiritRate: { type: Number, default: 0, min: 0, max: 5 },
    reliabilityRate: { type: Number, default: 0, min: 0, max: 5 },
  }
}, { timestamps: true });

/**
 * Password hash middleware.
 */
userSchema.pre('save', function hashPwd(next) {
  if (!this.isModified('password')) {
    return next();
  }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) { return next(err); }
    bcrypt.hash(this.password, salt, null, (err, hash) => {
      if (err) { return next(err); }
      this.password = hash;
      next();
    });
  });
});

/**
 * Helper method for validating user's password.
 */
/**
 * Helper method for validating user's password.
 */
userSchema.methods.comparePassword = function comparePassword(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    cb(err, isMatch);
  });
};

const User = mongoose.model('User', userSchema);

module.exports = User;


// function getUserByEmail(email) {
//   return new Promise((resolve, reject) => {
//     User.findOne({ email }, (err, user) => {
//       if (!user) {
//         reject('Account with that email address does not exist.');
//       }
//       resolve(user);
//     });
//   });
// }

// module.exports = getUserByEmail;
