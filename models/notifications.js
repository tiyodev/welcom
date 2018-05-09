const mongoose = require('mongoose');
const user = require('../models/users');

const Schema = mongoose.Schema;

const notificationSchema = new Schema({
  reciver: { type: Schema.ObjectId, ref: 'user' },
  type: String,
  title: String,
  description: String,
  ico: String,
  linkRedirect: String,
  isNew: Boolean  
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
