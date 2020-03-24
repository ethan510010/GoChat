const express = require('express');

const router = express.Router();
const { setUserPreferedLanguages } = require('../controller/language');

router.put('/userPreferedLanguage', setUserPreferedLanguages);

module.exports = router;
