const notificationController = require('./../controllers/notification');
const passportConfig = require('./../config/passport');

module.exports = function(app) {
  app.get('/notifications', passportConfig.isAuthenticated, notificationController.getUserNotifications);
  app.get('/notification/:id', passportConfig.isAuthenticated, notificationController.getNotificationById);
  app.get('/read/notification/:id', passportConfig.isAuthenticated, notificationController.setNotificationAsReadByNotificationIdAndRedirect);
}