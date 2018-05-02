const express = require('express');

const router = express.Router();
const profileController = require('./../controllers/profile');
const passportConfig = require('./../config/passport');
const uploadConfig = require('./../config/upload');

router.get('/:id', passportConfig.isAuthenticated, profileController.getProfile);
router.get('/:id/edit', passportConfig.isAuthenticated, profileController.getEditProfile);
router.post('/edit', passportConfig.isAuthenticated, profileController.checkProfileData, profileController.postEditProfile);
router.post('/edit/cover-upload/add', passportConfig.isAuthenticated, uploadConfig.uploadProfile.array('input-cover[]', 5), profileController.postAddProfileCover);
router.post('/edit/cover-upload/delete', passportConfig.isAuthenticated, profileController.postDeleteProfileCover);
router.post('/edit/profile-pic-upload/add', passportConfig.isAuthenticated, uploadConfig.uploadProfile.single('input-picture'), profileController.postAddProfilePic);
router.post('/edit/profile-pic-upload/delete', passportConfig.isAuthenticated, profileController.postDeleteProfilePic);
router.post('/:id/recommendation/add', passportConfig.isAuthenticated, profileController.checkRecommendationData, profileController.postRecommendation);
router.get('/:id/recommendation', passportConfig.isAuthenticated, profileController.getRecommendation);
router.get('/:id/experience', passportConfig.isAuthenticated, profileController.getExperience);
router.get('/:id/dashboard', passportConfig.isAuthenticated, profileController.getDashboard);

module.exports = router;
