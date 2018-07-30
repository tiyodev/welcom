const indexController = require('./../controllers/index');
const userController = require('./../controllers/user');

module.exports = function(app) {
  app.get('/', indexController.getIndex);
  app.get('/login', userController.getLogin);
  app.post('/login', userController.postLogin);
  app.get('/logout', userController.logout);
  app.get('/forgot', userController.getForgot);
  app.post('/forgot',  userController.checkEmailData, userController.postForgot);
  app.get('/reset/:token', userController.getReset);
  app.post('/reset/:token', userController.checkResetPwdData, userController.postReset);
  app.get('/verifyEmail/:validEmailToken', userController.getVerifyEmail);
  app.get('/signup', userController.getSignup);
  app.post('/signup', userController.checkSignupData, userController.postSignup);
}