var express = require('express');
var router = express.Router();
const { userProfile } = require('../controller/userLanguage');

router.get('/', userProfile);

module.exports = router;