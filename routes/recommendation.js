const express = require('express');

const router = express.Router();
const recommendationController = require('./../controllers/recommendation');
const passportConfig = require('./../config/passport');

router.post('/:id/response/add', passportConfig.isAuthenticated, recommendationController.checkRecommendationResponseData, recommendationController.postRecommendationResponse);
router.post('/:id/response-exp/add', passportConfig.isAuthenticated, recommendationController.checkRecommendationResponseData, recommendationController.postRecommendationResponseExp);

module.exports = router;
