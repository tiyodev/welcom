const express = require('express');

const router = express.Router();
const profileController = require('./../controllers/profile');

router.get('/', profileController.getProfile);
router.get('/edit', profileController.getEditProfile);
router.post('/edit', profileController.checkProfileData, profileController.postEditProfile);
router.get('/recommendation', profileController.getRecommendation);
router.get('/experience', profileController.getExperience);
router.get('/dashboard', profileController.getDashboard);

module.exports = router;
