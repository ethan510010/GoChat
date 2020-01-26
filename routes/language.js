var express = require('express');
var router = express.Router();
const { setUserPreferedLanguages } = require('../controller/language');

router.put('/userPreferedLanguage', setUserPreferedLanguages);

module.exports = router;