var express = require('express');
var router = express.Router();
const { getMessagesForEachRoom } = require('../controller/message');
const { checkMessagesCache } = require('../middleware/checkMessagesCache')

router.get('/getMessages', checkMessagesCache, getMessagesForEachRoom)

module.exports = router;