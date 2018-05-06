const mongoose = require('mongoose');

const Messaging = require('./../models/messagings');
const User = require('./../models/users');

const { check, validationResult } = require('express-validator/check');
const { sanitize, matchedData } = require('express-validator/filter');


function calcAge(data) {
  const now = new Date();
  let age = now - data;
  age = Math.floor(age / 1000 / 60 / 60 / 24 / 365);
  return age;
}

exports.checkSendMessageData = [
  check('messageInput', 'Please, write a message (2 to 500 signs).').trim().isLength({ min: 2, max: 500 }),
];

const getUserById = (userId) => {
  return new Promise((resolve, reject) => {
    console.log('>>>>>>>> getUserById');
    User.findById(userId, (err, user) => {
      if (err) {
        console.log('<<<<<<< getUserById ERR');
        reject(err);
      }
      if (!user) { 
        console.log('<<<<<<< getUserById ERR');
        reject(new Error('Wrong user ID!')); 
      }

      console.log('<<<<<<< getUserById OK');
      resolve(user);
    });
  });
}

const getOrCreateConversationBySenderIdAndReceiverId = ({senderId, receiverId}) => {
  return new Promise((resolve, reject) => {
    console.log(' >>>>>> getOrCreateConversationBySenderIdAndReceiverId');
    Messaging.findOne({
      firstParticipant: {$in: [senderId ,receiverId]}, 
      secondParticipant: {$in: [senderId ,receiverId]}
    }, (err, conversation) => {
      if (err) {
        console.log(' <<<<<< getOrCreateConversationBySenderIdAndReceiverId ERR');
        reject(err);
      }
      else{
        // Create conversation if it doesn't exist
        if(!conversation){
          const newConversation = new Messaging();
          newConversation.firstParticipant = senderId;
          newConversation.secondParticipant = receiverId;
          // Save conversation
          newConversation.save((err) => {
            if (err) {
              console.log(' <<<<<< getOrCreateConversationBySenderIdAndReceiverId ERR');
              reject(err);
            }
            console.log(' <<<<<< getOrCreateConversationBySenderIdAndReceiverId OK');
            resolve(newConversation);
          });
        }
        else{
          console.log(' <<<<<< getOrCreateConversationBySenderIdAndReceiverId OK');
          resolve(conversation);
        }
      }
    });
  });
}

const addMessageToConversation = ({conversation, message, senderId, req}) => {
  return new Promise((resolve, reject) => {
    console.log(' >>>>> addMessageToConversation');

    if (!conversation) { 
      console.log(' <<<<<< addMessageToConversation ERR');
      reject(new Error('Conversation not found!')); 
    }

    if(!conversation.messages) conversation.messages = [];

    if(senderId.equals(conversation.firstParticipant)){
      conversation.firstParticipantLastMsgDate = Date.now();
      conversation.firstParticipantHasNewMessage = true;

    } else if(senderId.equals(conversation.secondParticipant)){
      conversation.secondParticipantLastMsgDate = Date.now();
      conversation.secondParticipantHasNewMessage = true;
    }

    conversation.lastMsg = Date.now();

    conversation.messages.push({
      date: Date.now(),
      text: message,
      sender: senderId,
      isRead: false
    });

    conversation.save((err) => {
      if (err) {
        console.log(' <<<<<< addMessageToConversation ERR');
        reject(err);
      }
      console.log(' <<<<<< addMessageToConversation OK');
      resolve(conversation);
    });
  });
}

const getMessagesByConversationId = (conversationId) => {
  return new Promise((resolve, reject) => {
    console.log(' >>>>> getConversationMessages');
    Messaging.findById(conversationId , (err, conversation) => {
      
      if (err) {
        console.log(' <<<< getConversationMessages ERR');
        reject(err);
      }
      console.log(' <<<< getConversationMessages OK');
      resolve(conversation);
    })
    .populate({ path: 'messages.sender', select: '_id profile.profilePic', model: User })
    .populate({ 
      path: 'firstParticipant', 
      select: '_id profile.profilePic profile.firstName profile.nickName profile.city profile.birthdate profile.adjective profile.gender profile.spokenLanguages profile.learningLanguages profile.recommendations', 
      model: User })
    .populate({ 
      path: 'secondParticipant', 
      select: '_id profile.profilePic profile.firstName profile.nickName profile.city profile.birthdate profile.adjective profile.gender profile.spokenLanguages profile.learningLanguages profile.recommendations', 
      model: User });
  });
}

const getAllConversationsByUserId = (userId) => {
  return new Promise((resolve, reject) => {
    console.log(' >>>>>> getAllConversationsByUserId');
    Messaging.find({
      $or : [ {'firstParticipant': userId},  {'secondParticipant': userId} ]
    }, (err, conversations) => {
      if (err) {
        console.log(' <<<<<< getAllConversationsByUserId ERR');
        reject(err);
      }
      else{
        console.log(' <<<<<< getAllConversationsByUserId OK');
        resolve(conversations);
      }
    })
    .sort({ lastMsg : -1})
    .populate({ path: 'firstParticipant', select: '_id profile.profilePic profile.firstName profile.nickName profile.city', model: User })
    .populate({ path: 'secondParticipant', select: '_id profile.profilePic profile.firstName profile.nickName profile.city', model: User });
  });
}

const updateNotReadMessagesByConversationId = (conversationId, accountId) => {
  return new Promise((resolve, reject) => {
    console.log(` >>>>> updateNotReadMessagesByConversationId conversationId: ${conversationId}, accountId: ${accountId}`);
    
    if(conversationId === undefined || conversationId === null){
      reject(new Error("conversationId is null"));
    }
    if(accountId === undefined || accountId === null){
      reject(new Error("accountId is null"));
    }
    
    Messaging.findById(conversationId , (err, conversation) => {
      if (err) {
        console.log(' <<<< updateNotReadMessagesByConversationId ERR');
        reject(err);
      }

      // Update only if 
      if(conversation !== undefined && conversation !== null){
        if(accountId.equals(conversation.firstParticipant)){
          conversation.secondParticipantHasNewMessage = false;
        } else if(accountId.equals(conversation.secondParticipant)){
          conversation.firstParticipantHasNewMessage = false;
        }

        // Set isRead to true for all messages from accout user
        conversation.messages.forEach((msg) => {
          if(!msg.sender.equals(accountId)) msg.isRead = true;
        })

        conversation.save((err) => {
          if (err) {
            console.log(' <<<< updateNotReadMessagesByConversationId ERR');
            reject(err);
          }

          console.log(' <<<< updateNotReadMessagesByConversationId OK');
          resolve(conversation);
        })
      }
      else{
        reject(new Error("conversation not found"));
      }
    });
  });
}

exports.getLastUpdateConversationsByUserIdAndNbLast = (userId, nbLast) => {
  return new Promise((resolve, reject) => {
    console.log(` >>>>>> getLastUpdateConversationsByUserIdAndNbLast userId : ${userId}, nbLast : ${nbLast}`);
    Messaging.find({
      $or : [ {'firstParticipant': userId},  {'secondParticipant': userId} ]
    }, (err, conversations) => {
      if (err) {
        console.log(' <<<<<< getLastUpdateConversationsByUserIdAndNbLast ERR');
        reject(err);
      }
      else{
        console.log(` <<<<<< getLastUpdateConversationsByUserIdAndNbLast OK ${conversations.length}`);
        resolve(conversations);
      }
    })
    .sort({ lastMsg : -1})
    .limit(nbLast)
    .populate({ path: 'firstParticipant', select: '_id profile.profilePic profile.firstName profile.nickName profile.city', model: User })
    .populate({ path: 'secondParticipant', select: '_id profile.profilePic profile.firstName profile.nickName profile.city', model: User });
  });
}

/**
 * POST /
 * Send message
 */
exports.postSendMessage = (req, res, next) => {
  if (req.params.id) {
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {

       // Get sender id
       const senderId = req.account._id;
       // Get receiver id
       const receiverId = req.params.id;
       // Get message
       const message = req.body.messageInput;

      getUserById(receiverId)
      .then((user) => getOrCreateConversationBySenderIdAndReceiverId({senderId, receiverId}))
      .then((conversation) => addMessageToConversation({conversation, senderId, message, req}))
      .then((conversation) => {
      // res.redirect(`/messaging/${senderId}/conversation/${conversation._id}`);
        res.redirect('back');
      })
      .catch(err => next(err));

    } else { next(new Error('Wrong ID!')); }
  } else {
    next(new Error('Id not found'));
  }
};

/**
 * Get /
 * conversation message
 */
exports.getConversationMessages = (req, res, next) => {
  if(!req.params.id) {
    next(new Error('User id not found'));
  }
  else if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    next(new Error('Wrong user ID!'));
  }
  else {
    getMessagesByConversationId(req.params.id)
    .then((conversation) => {
      const oldConversation = conversation;

      // Update not read message
      updateNotReadMessagesByConversationId(conversation._id, req.account._id)
      .catch(err => console.error(err));
      
      const displayParticipant = oldConversation.firstParticipant._id.equals(req.account._id) ? oldConversation.secondParticipant : oldConversation.firstParticipant;
      
      const age = calcAge(displayParticipant.profile.birthdate);
      const shortPresentationSentence = `${displayParticipant.profile.adjective} ${age} years old traveller.`;
      const genderAdv = displayParticipant.profile.gender === 'man' ? 'He' : 'She';
      let i = 0;
      let spokenLanguages = '';
      if (displayParticipant.profile.spokenLanguages && Array.isArray(displayParticipant.profile.spokenLanguages)) {
        displayParticipant.profile.spokenLanguages.forEach((elem) => {
          if (i++ > 0) spokenLanguages += ' and ';
          spokenLanguages += elem.language;
        });
      }
      i = 0;
      let learningLanguages = '';
      if (displayParticipant.profile.learningLanguages && Array.isArray(displayParticipant.profile.learningLanguages)) {
        displayParticipant.profile.learningLanguages.forEach((elem) => {
          if (i++ > 0) learningLanguages += ' and ';
          learningLanguages += elem.language;
        });
      }

      let shortLearnSentence = `${genderAdv} speaks ${spokenLanguages}`;

      if (learningLanguages) { shortLearnSentence += `, and learns ${learningLanguages}`; }

      shortLearnSentence += '.';

      return res.render('messaging/messages', {
        title: 'Messages',
        conversation: oldConversation,
        shortPresentationSentence,
        shortLearnSentence
      });
    })
    .catch(err => next(err));
  }
};

/**
 * GET /
 * Get conversation
 */
exports.getConversations = (req, res, next) => {
  if(!req.account._id) {
    next(new Error('You must be logged in to access this content'));
  }
  else {
    getAllConversationsByUserId(req.account._id)
    .then((conversations) => {
      return res.render('messaging/conversations', {
        title: 'Conversations',
        conversations
      });
    })
    .catch(err => next(err));
  }
};
