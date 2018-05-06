const mongoose = require('mongoose');
const user = require('../models/users');

const Schema = mongoose.Schema;

const messagingSchema = new Schema({
  firstParticipant: { type: Schema.ObjectId, ref: 'user' },
  secondParticipant: { type: Schema.ObjectId, ref: 'user' },
  firstParticipantHasNewMessage: Boolean,
  secondParticipantHasNewMessage: Boolean,
  firstParticipantLastMsgDate: Date,
  secondParticipantLastMsgDate: Date,
  lastMsg: Date,
  messages: [{
    date: Date,
    text: String,
    sender: { type: Schema.ObjectId, ref: 'user' },
    isRead: Boolean
  }]

}, { timestamps: true });

const Messaging = mongoose.model('Messaging', messagingSchema);

module.exports = Messaging;
