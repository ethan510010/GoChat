var express = require('express');
var router = express.Router();
const { getMessagesForEachRoom, messageTranslation } = require('../controller/message');
const { checkMessagesCache } = require('../middleware/checkMessagesCache')

router.get('/getMessages', checkMessagesCache, getMessagesForEachRoom);

router.post('/translateMessage', messageTranslation);

module.exports = router;