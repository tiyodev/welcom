const footerController = require('./../controllers/footer');

module.exports = function(app) {
  app.get('/termsofuse', footerController.getTermsOfUse);
  app.get('/meetteam', footerController.getWelcomTeam);
  app.get('/contactus', footerController.getContactUs);
  app.get('/needyou', footerController.getNeedYou);
  app.get('/readblog', footerController.getReadBlog);
  app.get('/learnmore', footerController.getLearnMore);
}
