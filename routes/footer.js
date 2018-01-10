const express = require('express');

const router = express.Router();
const footerController = require('./../controllers/footer');

router.get('/termsofuse', footerController.getTermsOfUse);
router.get('/meetteam', footerController.getWelcomTeam);
router.get('/contactus', footerController.getContactUs);
router.get('/needyou', footerController.getNeedYou);
router.get('/readblog', footerController.getReadBlog);
router.get('/learnmore', footerController.getLearnMore);


module.exports = router;
