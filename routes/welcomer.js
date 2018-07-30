const passportConfig = require('./../config/passport');
const welcomerController = require('./../controllers/welcomer');

module.exports = function(app) {
  app.get('/welcomer/become', welcomerController.getBecomeWelcomer);
  app.post('/welcomer/become', passportConfig.isAuthenticated, welcomerController.checkBecomeWelcomerData, welcomerController.postBecomeWelcomer);
}
