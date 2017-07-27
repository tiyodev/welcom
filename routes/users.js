const express = require('express');

const router = express.Router();

/* GET users listing. */
router.get('/', (req, res) => {
  res.send('respond with a resource');
});

/* GET users listing. */
router.get('/test', (req, res) => {
  res.send('respond with a seconde resource');
});

module.exports = router;
