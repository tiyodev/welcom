const mongoose = require('mongoose');
const userModel = require('../models/users');
const experienceModel = require('../models/experiences');
const messagingModel = require('../models/messaging');

const Schema = mongoose.Schema;

/**
 * @name Status
 * @desc Defines all available status for a booking
 * @readonly
 * @enum {string}
 */
const Status = Object.freeze({
  Pending: 'pending',
  Upcomming: 'upcomming',
  Ended: 'ended',
  Canceled: 'canceled'
});

/**
 * @name bookingSchema
 * @desc Defines the database schema of the Bookings document
 */
const bookingSchema = new Schema({
  date: Date,
  nbTravellers: Number,
  message: { type: Schema.ObjectId, ref: 'messagingModel' },
  traveller: { type: Schema.ObjectId, ref: 'userModel' },
  experience: { type: Schema.ObjectId, ref: 'experienceModel' },
  status: { type: String, enum: Object.values(Status) }
}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
