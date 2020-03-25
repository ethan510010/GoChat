const express = require('express');

const router = express.Router();
const { setUserPreferedLanguages } = require('../controller/language');

router.put('/language/userPreferedLanguage', setUserPreferedLanguages);

module.exports = router;
