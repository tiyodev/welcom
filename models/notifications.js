const mongoose = require('mongoose');
const userModel = require('../models/users');

const Schema = mongoose.Schema;

/**
 * @name NotificationTypes
 * @desc Defines all possible types of notification
 * @readonly
 * @enum {String}
 */
const NotificationTypes = Object.freeze({
  Welcoming: 'welcoming',
  NewWelcomer: 'newWelcomer',
  ExpRequestReceived: 'expRequestReceived',
  ExpRequestAccepted: 'expRequestAccepted',
  ExpRequestRefused: 'expRequestRefused',
  ExpRequestModifiedByTraveller: 'expRequestModifiedByTraveller',
  ExpRequestModifiedByWelcomer: 'expRequestModifiedByWelcomer',
  ExpRequestCancelledByTraveller: 'expRequestCancelledByTraveller',
  ExpRequestCancelledByWelcomer: 'expRequestCancelledByWelcomer',
  ReminderTraveller: 'reminderTraveller',
  ReminderWelcomer: 'reminderWelcomer',
  ReviewReceivedOnProfile: 'reviewReceivedOnProfile',
  ReviewReceivedOnExp: 'reviewReceivedOnExp',
  ReminderGiveReviewForWelcomer: 'reminderGiveReviewForWelcomer',
  ReminderGiveReviewForTraveller: 'reminderGiveReviewForTraveller'
});

/**
 * @name NotificationIcons
 * @desc Defines all icons available for notifications
 * @readonly
 * @enum {String}
 */
const NotificationIcons = Object.freeze({
  ArrowCircleRight: 'fa-arrow-alt-circle-right',
  Check: 'fa-check',
  TimesCircle: 'fa-times-circle',
  ExclamationTriangle: 'fa-exclamation-triangle',
  Bell: 'fa-bell'
});

/**
 * @name NotificationIcons
 * @desc Defines all available colors for icons
 * @readonly
 * @enum {String}
 */
const NotificationIconsColor = Object.freeze({
  Yellow: 'text-warning',
  Green: 'text-success',
  Red: 'text-danger',
  Blue: 'text-primary'
});

/**
 * @name notificationSchema
 * @desc Defines the database schema of the Notification document
 */
const notificationSchema = new Schema({
  reciver: { type: Schema.ObjectId, ref: 'userModel' },
  type: { type: String, enum: Object.values(NotificationTypes) },
  title: String,
  description: String,
  icon: { type: String, enum: Object.values(NotificationIcons) },
  iconColor: { type: String, enum: Object.values(NotificationIconsColor) },
  linkRedirect: String,
  isRead: Boolean  
}, { timestamps: true });

/**
 * @function
 * @name notificationFactory
 * @desc Factory => Create a notification instance based on the notification type
 * @param {Object<String>} notificationType - Notification type
 * @param {Object} receiverId - Receiver id
 * @param {Object} traveller - Traveller object
 * @param {Object} welcomer - Welcomer object
 * @param {Object} experience - Experience object
 * @returns {Object} Instance of notification
 */
notificationSchema.static('notificationFactory', function(notificationType, receiverId, traveller = {}, welcomer = {}, experience = {}) {
  return new Promise((resolve, reject) => {
    switch(notificationType){
      case NotificationTypes.Welcoming:
        resolve(new Notification({
          reciver: receiverId,
          type: NotificationTypes.Welcoming,
          title: 'Create your profile :)',
          description: 'Welcome ! Now please create your profile to let the other members discover who you are. Complete and sincere profiles make it easier to build trust between community members.',
          icon: NotificationIcons.ArrowCircleRight,
          iconColor: NotificationIconsColor.Green,
          linkRedirect: `/profile/${receiverId}/`,
          isRead: false
        }));
      case NotificationTypes.NewWelcomer:
        resolve(new Notification({
          reciver: receiverId,
          type: NotificationTypes.NewWelcomer,
          title: 'You are now a welcomer !',
          description: 'Congrats ! You are now a welcomer ! Discover the new features of your profile: welcomer dashboard and experiences. You can now create experiences!',
          icon: NotificationIcons.Check,
          iconColor: NotificationIconsColor.Green,
          linkRedirect: `/profile/${receiverId}/experience`,
          isRead: false,
        }));
      case NotificationTypes.ExpRequestReceived:
        resolve(new Notification({
          reciver: receiverId,
          type: NotificationTypes.ExpRequestReceived,
          title: 'New booking request :)',
          description: `Yeah ! You received a new booking request from ${traveller.nickName} for your experience ${experience.title}. See it on your dashboard or messages board!`,
          icon: NotificationIcons.Check,
          iconColor: NotificationIconsColor.Green,
          linkRedirect: `/profile/${receiverId}/dashboard`,
          isRead: false,
        }));
      case NotificationTypes.ExpRequestAccepted: 
        resolve(new Notification({
          reciver: receiverId,
          type: NotificationTypes.ExpRequestAccepted,
          title: 'Booking request accepted',
          description: `Yeah ! The welcomer accepted your booking request for ${experience.title}. Now you two can send messages to each others to prepare this meeting`,
          icon: NotificationIcons.Check,
          iconColor: NotificationIconsColor.Green,
          linkRedirect: `/profile/${receiverId}/dashboard`,
          isRead: false,
        }));
      case NotificationTypes.ExpRequestRefused: 
        resolve(new Notification({
          reciver: receiverId,
          type: NotificationTypes.ExpRequestRefused,
          title: 'Booking request refused',
          description: 'The welcomer couldn\'t accept your booking request... And we are sorry for that. But you can find other ones to book !',
          icon: NotificationIcons.Check,
          iconColor: NotificationIconsColor.Red,
          linkRedirect: `/experience/list`,
          isRead: false,
        }));
      case NotificationTypes.ExpRequestModifiedByTraveller: 
        resolve(new Notification({
          reciver: receiverId,
          type: NotificationTypes.ExpRequestModifiedByTraveller,
          title: 'New date proposed',
          description: `${traveller.nickName} asked to change the date for ${experience.title}. You can see it in your messages.`,
          icon: NotificationIcons.ExclamationTriangle,
          iconColor: NotificationIconsColor.Yellow,
          linkRedirect: `/profile/${receiverId}/dashboard`,
          isRead: false,
        }));
      case NotificationTypes.ExpRequestModifiedByWelcomer: 
        resolve(new Notification({
          reciver: receiverId,
          type: NotificationTypes.ExpRequestModifiedByWelcomer,
          title: 'New date proposed',
          description: `${welcomer.nickName} asked to change the date for ${experience.title}. You can see it in your messages.`,
          icon: NotificationIcons.ExclamationTriangle,
          iconColor: NotificationIconsColor.Yellow,
          linkRedirect: `/profile/${receiverId}/dashboard`,
          isRead: false,
        }));
      case NotificationTypes.ExpRequestCancelledByTraveller: 
        resolve(new Notification({
          reciver: receiverId,
          type: NotificationTypes.ExpRequestCancelledByTraveller,
          title: 'Experience cancelled',
          description: `Sorry, ${traveller.nickName} cancelled the booking for ${experience.title}... But thanks for accepting at first! We are sure other travellers will want to meet you soon.`,
          icon: NotificationIcons.ExclamationTriangle,
          iconColor: NotificationIconsColor.Yellow,
          linkRedirect: `/profile/${receiverId}/dashboard`,
          isRead: false,
        }));
      case NotificationTypes.ExpRequestCancelledByWelcomer:
        resolve(new Notification({
          reciver: receiverId,
          type: NotificationTypes.ExpRequestCancelledByWelcomer,
          title: 'Experience cancelled',
          description: `Sorry, ${welcomer.nickName} cancelled the booking for ${experience.title}. But you can find other ones to book!`,
          icon: NotificationIcons.ExclamationTriangle,
          iconColor: NotificationIconsColor.Yellow,
          linkRedirect: `/experience/list`,
          isRead: false,
        }));
      case NotificationTypes.ReminderTraveller: 
        resolve(new Notification({
          reciver: receiverId,
          type: NotificationTypes.ReminderTraveller,
          title: 'Experience tomorrow :D',
          description: `Amazing ! Tomorrow, you will live ${experience.title} with ${welcomer.nickName}. We wish you both a great time!`,
          icon: NotificationIcons.Bell,
          iconColor: NotificationIconsColor.Blue,
          linkRedirect: `/profile/${receiverId}/dashboard`,
          isRead: false,
        }));
      case NotificationTypes.ReminderWelcomer: 
        resolve(new Notification({
          reciver: receiverId,
          type: NotificationTypes.ReminderWelcomer,
          title: 'Experience tomorrow :D',
          description: `Great ! Tomorrow, you will make ${traveller.nickName} live ${experience.title}. We wish you both a great time!`,
          icon: NotificationIcons.Bell,
          iconColor: NotificationIconsColor.Blue,
          linkRedirect: `/profile/${receiverId}/dashboard`,
          isRead: false,
        }));
      case NotificationTypes.ReviewReceivedOnProfile:
        resolve(new Notification({
          reciver: receiverId,
          type: NotificationTypes.ReviewReceivedOnProfile,
          title: 'New review received',
          description: 'You have a new review on your profile. Check it out!',
          icon: NotificationIcons.Check,
          iconColor: NotificationIconsColor.Green,
          linkRedirect: `/profile/${receiverId}/recommendation`,
          isRead: false,
        }));
      case NotificationTypes.ReviewReceivedOnExp:
        resolve(new Notification({
          reciver: receiverId,
          type: NotificationTypes.ReviewReceivedOnExp,
          title: 'New review received',
          description: `Your experience ${experience.title} has a new review. Check it out!`,
          icon: NotificationIcons.Check,
          iconColor: NotificationIconsColor.Green,
          linkRedirect: `/experience/${experience._id}`,
          isRead: false,
        }));
      case NotificationTypes.ReminderGiveReviewForWelcomer: 
        resolve(new Notification({
          reciver: receiverId,
          type: NotificationTypes.ReminderGiveReviewForWelcomer,
          title: 'Please give a review :)',
          description: `How was the meeting ? You can write a review on ${traveller.nickName}\'s profile to let the others community members know what you think about it. Reviews build trust inside the community!`,
          icon: NotificationIcons.Bell,
          iconColor: NotificationIconsColor.Blue,
          linkRedirect: `/profile/${traveller._id}/recommendation`,
          isRead: false,
        }));
      case NotificationTypes.ReminderGiveReviewForTraveller: 
        resolve(new Notification({
          reciver: receiverId,
          type: NotificationTypes.ReminderGiveReviewForTraveller,
          title: 'Please give a review :)',
          description: `How was the meeting ? You can write a review on ${welcomer.nickName}\'s profile and on the experience ${experience.title} to let the other community members know what you think. Reviews build trust inside the community!`,
          icon: NotificationIcons.Bell,
          iconColor: NotificationIconsColor.Blue,
          linkRedirect: `/experience/${experience._id}`,
          isRead: false,
        }));
      default:
        reject(new Error('Notification type unknown !'));
    }
  });
});

/**
 * @function
 * @name getAllNotificationsByUserId
 * @desc Get all notifications by user id
 * @param {Object} userId - User id
 * @returns {Array<Object>} Notification array
 */
notificationSchema.static('getAllNotificationsByUserId', function(userId){
  return new Promise((resolve, reject) => {
    Notification.find({'reciver': userId}, (err, notifications) => {
      if (err) {
        reject(err);
      }
      resolve(notifications);
    })
    .sort({ createdAt : -1});
  });
});

/**
 * @function
 * @name getAllUnreadNotificationsByUserId
 * @desc Get all unread notifications by user id
 * @param {Object} userId - User id
 * @returns {Array<Object>} Notification array
 */
notificationSchema.static('getAllUnreadNotificationsByUserId', function(userId){
  return new Promise((resolve, reject) => {
    Notification.find({'reciver': userId, 'isRead': false}, (err, notifications) => {
      if (err) {
        reject(err);
      }
      resolve(notifications);
    })
    .sort({ createdAt : -1});
  });
});

/**
 * @function
 * @name getNbLastNotificationsByUserId
 * @desc Get the last nbLast notifications of a user
 * @param {Object} userId - User id
 * @param {Object} nbLast - Number of notification
 * @returns {Array<Object>} Notification array
 */
notificationSchema.static('getNbLastNotificationsByUserId', function(userId, nbLast){
  return new Promise((resolve, reject) => {
    Notification.find({'reciver': userId}, (err, notifications) => {
      if (err) {
        reject(err);
      }
      resolve(notifications);
    })
    .sort({ createdAt : -1})
    .limit(nbLast);
  });
});

/**
 * @function
 * @name setNotificationAsReadByNotificationId
 * @desc Mark as read a notification
 * @param {Array<Object>} notifId - Notification id
 * @returns {Object} Modified notification
 */
notificationSchema.static('setNotificationAsReadByNotificationId', function(notifId){
  return new Promise((resolve, reject) => {
    if(!notifId) {
      reject(new Error('Notification id is null or undefined!'));
    }
    
    if (!mongoose.Types.ObjectId.isValid(notifId)) {
      reject(new Error('Wrong notification ID!'));
    }
  
    Notification.findById(notifId).then((notif) => {
      notif.isRead = true;
      notif.save();
      resolve(notif);
    });
  });
});

/**
 * @function
 * @name createNotification
 * @desc Create a notification in the database
 * @param {Object} notif - Notification to create
 * @returns {Object} Created notification
 */
notificationSchema.static('createNotification', function(notif){
  return new Promise((resolve, reject) => {
    notif.save((err, notification) => {
      if (err) {
        reject(err);
      }
      resolve(notification);
    });
  });
});

notificationSchema.statics.NotificationTypes = NotificationTypes;

notificationSchema.statics.NotificationIcons = NotificationIcons;

notificationSchema.statics.NotificationIconsColor = NotificationIconsColor;

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
