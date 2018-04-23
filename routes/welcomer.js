const express = require('express');

const router = express.Router();
const passportConfig = require('./../config/passport');
const welcomerController = require('./../controllers/welcomer');

router.get('/become', welcomerController.getBecomeWelcomer);
router.post('/become', passportConfig.isAuthenticated, welcomerController.checkBecomeWelcomerData, welcomerController.postBecomeWelcomer);

module.exports = router;
