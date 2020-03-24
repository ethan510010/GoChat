const express = require('express');

const router = express.Router();
const { userProfile } = require('../controller/userLanguage');

router.get('/', userProfile);

module.exports = router;
