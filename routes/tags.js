const express = require('express');

const router = express.Router();
const tagsController = require('./../controllers/tags');

router.get('/autocomplete', tagsController.getTags);

module.exports = router;
