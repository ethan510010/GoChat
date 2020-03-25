const express = require('express');

const router = express.Router();
const { userProfile } = require('../controller/userLanguage');

router.get('/userLanguage', userProfile);

module.exports = router;
