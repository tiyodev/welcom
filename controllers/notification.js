const mongoose = require('mongoose');

const Notification = require('./../models/notifications');

/**
 * @function
 * @name createNotification
 * @desc Create a new notification
 * @param {Notification.NotificationTypes} notificationType - Type of notification
 * @param {ObjectId} receiverId - User object id
 * @returns {object} Created notification
 */
exports.createNotification = async (notificationType, receiverId) => {
  try{
    const newNotif = await Notification.notificationFactory(notificationType, receiverId);
    return await Notification.createNotification(newNotif);
  } catch (err){
    throw err;
  }
}

/**
 * @function
 * @name getNotificationById
 * @desc Get a notification by id
 * @param {object} req - HTTP request argument to the middleware function, conventionally called "req".
 * @param {object} res - HTTP response argument to the middleware function, conventionally called "res".
 * @param {function} next - Reminder argument to the middleware function, called "next" by convention.
 * @returns {json} Notification
 */
exports.getNotificationById = async (req, res, next) => {
  if(!req.params.id) {
    next(new Error('Notification id not found'));
  }
  
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    next(new Error('Wrong notification ID!'));
  }

  try{
    const notif = await Notification.findById(notificationId);
    return res.json(notif);
  }
  catch(err){
    next(err)
  }
};

/**
 * @function
 * @name getUserNotifications
 * @desc Get all user notifications, and mark all unread notifications as read
 * @param {object} req - HTTP request argument to the middleware function, conventionally called "req".
 * @param {object} res - HTTP response argument to the middleware function, conventionally called "res".
 * @param {function} next - Reminder argument to the middleware function, called "next" by convention.
 * @returns {view} Notifications page
 */
exports.getUserNotifications = async (req, res, next) => {
  if(!req.account._id) {
    next(new Error('You must be logged in to access this content'));
  }
  else {
    try{
      const notifications = await Notification.getAllNotificationsByUserId(req.account._id);

      // Mark all unread notifications as read
      const unreadNotifications = await Notification.getAllUnreadNotificationsByUserId(req.account._id);
      unreadNotifications.forEach((notif) => {
        Notification.setNotificationAsReadByNotificationId(notif._id);
      });

      return res.render('notification/notifications', {
        title: 'Notifications',
        notifications
      });

    } catch(err){
      next(err);
    }
  }
};

/**
 * @function
 * @name setNotificationAsReadByNotificationIdAndRedirect
 * @desc Define the notification as read by the notification identifier and then redirect to the correct link.
 * @param {object} req - HTTP request argument to the middleware function, conventionally called "req".
 * @param {object} res - HTTP response argument to the middleware function, conventionally called "res".
 * @param {function} next - Reminder argument to the middleware function, called "next" by convention.
 * @returns {view} Notification redirect view
 */
exports.setNotificationAsReadByNotificationIdAndRedirect = async (req, res, next) => {
  if(!req.params.id) {
    next(new Error('Notification id is null or undefined!'));
  }
  
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    next(new Error('Wrong notification ID!'));
  }

  try{
    const notif = await Notification.setNotificationAsReadByNotificationId(req.params.id);
    res.redirect(notif.linkRedirect);
  } catch(err) {
    next(err);
  }
}

/**
 * @function
 * @name getNbLastNotificationsByUserId
 * @desc Get the last nbLast notifications of a user
 * @param {ObjectId} userId - User id
 * @param {int} nbLast - Number of notifications to be returned
 * @returns {object} nbLast notifications
 */
exports.getNbLastNotificationsByUserId = async (userId, nbLast) => {
  if(!userId) {
    next(new Error('User id is mandatory !'));
  }
  else {
    try{
      return await Notification.getNbLastNotificationsByUserId(userId, nbLast);
    } catch(err){
      next(err);
    }
  }
};