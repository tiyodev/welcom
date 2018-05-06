const express = require('express');

const router = express.Router();
const messagingController = require('./../controllers/messaging');
const passportConfig = require('./../config/passport');

router.post('/:id/message/send', passportConfig.isAuthenticated, messagingController.checkSendMessageData, messagingController.postSendMessage);

router.get('/conversations', passportConfig.isAuthenticated, messagingController.getConversations);
router.get('/conversations/:id', passportConfig.isAuthenticated, messagingController.getConversationMessages);
router.get('/conversations/:id/message/send', passportConfig.isAuthenticated, messagingController.getConversationMessages);

module.exports = router;
