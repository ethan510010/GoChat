var express = require('express');
var router = express.Router();
const { namespacePage, createNamespace, invitePeopleToNamespace } = require('../controller/namespace');

router.get('/', namespacePage);

router.post('/createNamespace', createNamespace);

router.post('/invitePeople', invitePeopleToNamespace);

module.exports = router;