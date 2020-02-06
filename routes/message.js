var express = require('express');
var router = express.Router();
const { getMessagesForEachRoom, messageTranslation, uploadMessageImage } = require('../controller/message');
const { checkMessagesCache } = require('../middleware/checkMessagesCache')

// router.get('/getMessages', checkMessagesCache, getMessagesForEachRoom);

router.get('/getMessages', getMessagesForEachRoom);

router.post('/translateMessage', messageTranslation);

router.post('/uploadImage', uploadMessageImage);

module.exports = router;