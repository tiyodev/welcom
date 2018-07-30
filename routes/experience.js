const passportConfig = require('./../config/passport');
const uploadConfig = require('./../config/upload');
const experienceController = require('./../controllers/experience');

module.exports = function(app) {
  app.get('/experience/create', passportConfig.isAuthenticated, experienceController.getCreateExperience);
  app.post('/experience/create', passportConfig.isAuthenticated, experienceController.checkCreateExperienceData, experienceController.postCreateExperience);

  app.post('/experience/create/cover-upload/add', passportConfig.isAuthenticated, uploadConfig.uploadExperience.array('input-cover[]', 5), experienceController.postAddExperienceCover);
  app.post('/experience/create/cover-upload/delete', passportConfig.isAuthenticated, experienceController.postDeleteExperienceCover);

  app.post('/experience/edit/cover-upload/add', passportConfig.isAuthenticated, uploadConfig.uploadExperience.array('input-cover[]', 5), experienceController.postAddExperienceCover);
  app.post('/experience/edit/cover-upload/delete', passportConfig.isAuthenticated, experienceController.postDeleteExperienceCover);

  app.get('/experience/list', experienceController.getExperienceList);

  app.get('/experience/:id', experienceController.getExperience);
  app.get('/experience/:id/edit', passportConfig.isAuthenticated, experienceController.getEditExperience);
  app.post('/experience/:id/edit', passportConfig.isAuthenticated, experienceController.checkCreateExperienceData, experienceController.postEditExperience);
  app.post('/experience/:id/recommendation/add', passportConfig.isAuthenticated, experienceController.checkRecommendationData, experienceController.postRecommendation);
}
