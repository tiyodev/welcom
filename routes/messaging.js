const messagingController = require('./../controllers/messaging');
const passportConfig = require('./../config/passport');

module.exports = function(app) {
  app.post('/messaging/:id/message/send', passportConfig.isAuthenticated, messagingController.checkSendMessageData, messagingController.postSendMessage);
  app.get('/messaging/conversations', passportConfig.isAuthenticated, messagingController.getConversations);
  app.get('/messaging/conversations/:id', passportConfig.isAuthenticated, messagingController.getConversationMessages);
  app.get('/messaging/conversations/:id/message/send', passportConfig.isAuthenticated, messagingController.getConversationMessages);
}