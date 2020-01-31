var express = require('express');
var router = express.Router();

const { chatPageContent } = require('../controller/chat');

router.get('/', chatPageContent);

module.exports = router;
