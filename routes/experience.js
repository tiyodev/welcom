const express = require('express');

const router = express.Router();
const passportConfig = require('./../config/passport');
const uploadConfig = require('./../config/upload');
const experienceController = require('./../controllers/experience');

router.get('/create', passportConfig.isAuthenticated, experienceController.getCreateExperience);
router.post('/create', passportConfig.isAuthenticated, experienceController.checkCreateExperienceData, experienceController.postCreateExperience);

router.post('/create/cover-upload/add', passportConfig.isAuthenticated, uploadConfig.uploadExperience.array('input-cover[]', 5), experienceController.postAddExperienceCover);
router.post('/create/cover-upload/delete', passportConfig.isAuthenticated, experienceController.postDeleteExperienceCover);

router.post('/edit/cover-upload/add', passportConfig.isAuthenticated, uploadConfig.uploadExperience.array('input-cover[]', 5), experienceController.postAddExperienceCover);
router.post('/edit/cover-upload/delete', passportConfig.isAuthenticated, experienceController.postDeleteExperienceCover);

router.get('/list', experienceController.getExperienceList);

router.get('/:id', experienceController.getExperience);
router.get('/:id/edit', passportConfig.isAuthenticated, experienceController.getEditExperience);
router.post('/:id/edit', passportConfig.isAuthenticated, experienceController.checkCreateExperienceData, experienceController.postEditExperience);

module.exports = router;
