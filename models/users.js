const bcrypt = require('bcrypt-nodejs');
// const crypto = require('crypto');
const mongoose = require('mongoose');
const interest = require('../models/interests');
// const experience = require('../models/experiences');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  /* General */
  registrationDate: Date,
  isActive: { type: Boolean, default: true },
  isAdmin: { type: Boolean, default: false },
  /* OAuth */
  twitter: String,
  google: String,
  facebook: String,
  tokens: Array,
  /* Password */
  password: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  /* Email */
  email: { type: String, unique: true, maxlength: 254 },
  newEmail: { type: String, maxlength: 254 },
  validEmail: { type: Boolean, default: false },
  validEmailToken: String,
  validEmailTokenExpires: Date,
  lastChangeEmail: Date,
  /* welcomer */
  isWelcomer: { type: Boolean, default: false },
  welcomerReason: String,
  /* Profile */
  profile: {
    coverPic: [{
      label: String,
      picture: String
    }],
    profilePic: {
      label: String,
      picture: String
    },
    nickName: String,
    firstName: String,
    lastName: String,
    phoneNumber: String,
    city: String,
    gender: { type: String, enum: ['woman', 'man'] },
    adjective: String,
    birthdate: Date,
    spokenLanguages: [{
      language: String,
      isoCode: String
    }],
    learningLanguages: [{
      language: String,
      isoCode: String
    }],
    intro: String,
    interests: [{ type: Schema.ObjectId, ref: 'interest' }],
    description: String,
    shareWithCommunity: String,
    tripLived: String,
    travelPlan: String,
    facebookLink: String,
    twitterLink: String,
    instagramLink: String,
    otherLink: String,
    nbRecommendation: { type: Number, min: 0, default: 0 }
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
userSchema.methods.comparePassword = function comparePassword(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    cb(err, isMatch);
  });
};

const User = mongoose.model('User', userSchema);

module.exports = User;
