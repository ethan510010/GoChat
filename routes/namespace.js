var express = require('express');
var router = express.Router();
const { namespacePage, createNamespace, invitePeopleToNamespace, updateNamespace } = require('../controller/namespace');
const { checkTokenExpired } = require('../middleware/checkTokenExpired');

router.get('/', checkTokenExpired, namespacePage);

router.post('/createNamespace', createNamespace);

router.put('/updateNamespace', updateNamespace);

router.post('/invitePeople', invitePeopleToNamespace);

module.exports = router;