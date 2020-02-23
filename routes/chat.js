var express = require('express');
var router = express.Router();

const { chatPageContent } = require('../controller/chat');
const { checkTokenExpired } = require('../middleware/checkTokenExpired');

router.get('/', checkTokenExpired, chatPageContent);

module.exports = router;
