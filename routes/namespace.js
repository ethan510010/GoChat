var express = require('express');
var router = express.Router();
const { namespacePage, listNamespaces, createNamespace, invitePeopleToNamespace } = require('../controller/namespace');

router.get('/', namespacePage);

router.get('/listNamespaces', listNamespaces);

router.post('/createNamespace', createNamespace);

router.post('/invitePeople', invitePeopleToNamespace);

module.exports = router;