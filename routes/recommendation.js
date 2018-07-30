const recommendationController = require('./../controllers/recommendation');
const passportConfig = require('./../config/passport');

module.exports = function(app) {
  app.post('/recommendation/:id/response/add', passportConfig.isAuthenticated, recommendationController.checkRecommendationResponseData, recommendationController.postRecommendationResponse);
  app.post('/recommendation/:id/response-exp/add', passportConfig.isAuthenticated, recommendationController.checkRecommendationResponseData, recommendationController.postRecommendationResponseExp);
}