const express = require('express');

const router = express.Router();
const {
  namespacePage, createNamespace, invitePeopleToNamespace, updateNamespace,
} = require('../controller/namespace');
const { checkTokenExpired } = require('../middleware/checkTokenExpired');

router.get('/namespace', checkTokenExpired, namespacePage);

router.post('/namespace', createNamespace);

router.put('/namespace', updateNamespace);

router.post('/namespace/people', invitePeopleToNamespace);

module.exports = router;
