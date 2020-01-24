var express = require('express');
var router = express.Router();
const { getMessagesForEachRoom } = require('../controller/message');

router.get('/getMessages', getMessagesForEachRoom)

module.exports = router;