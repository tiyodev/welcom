const express = require('express');

const router = express.Router();
const indexController = require('./../controllers/index');
const userController = require('./../controllers/user');

router.get('/', indexController.getIndex);

router.get('/login', userController.getLogin);
router.post('/login', userController.postLogin);
router.get('/logout', userController.logout);
router.get('/forgot', userController.getForgot);
router.post('/forgot',  userController.checkEmailData, userController.postForgot);
router.get('/reset/:token', userController.getReset);
router.post('/reset/:token', userController.checkResetPwdData, userController.postReset);
router.get('/verifyEmail/:validEmailToken', userController.getVerifyEmail);
router.post('/signup', userController.postSignup);
router.get('/signup', userController.getSignup);

module.exports = router;
