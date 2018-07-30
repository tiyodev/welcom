const profileController = require('./../controllers/profile');
const passportConfig = require('./../config/passport');
const uploadConfig = require('./../config/upload');

module.exports = function(app) {
  app.get('/profile/:id', passportConfig.isAuthenticated, profileController.getProfile);
  app.get('/profile/:id/edit', passportConfig.isAuthenticated, profileController.getEditProfile);
  app.post('/profile/edit', passportConfig.isAuthenticated, profileController.checkProfileData, profileController.postEditProfile);
  app.post('/profile/edit/cover-upload/add', passportConfig.isAuthenticated, uploadConfig.uploadProfile.array('input-cover[]', 5), profileController.postAddProfileCover);
  app.post('/profile/edit/cover-upload/delete', passportConfig.isAuthenticated, profileController.postDeleteProfileCover);
  app.post('/profile/edit/profile-pic-upload/add', passportConfig.isAuthenticated, uploadConfig.uploadProfile.single('input-picture'), profileController.postAddProfilePic);
  app.post('/profile/edit/profile-pic-upload/delete', passportConfig.isAuthenticated, profileController.postDeleteProfilePic);
  app.post('/profile/:id/recommendation/add', passportConfig.isAuthenticated, profileController.checkRecommendationData, profileController.postRecommendation);
  app.get('/profile/:id/recommendation', passportConfig.isAuthenticated, profileController.getRecommendation);
  app.get('/profile/:id/experience', passportConfig.isAuthenticated, profileController.getExperience);
  app.get('/profile/:id/dashboard', passportConfig.isAuthenticated, profileController.getDashboard);
}