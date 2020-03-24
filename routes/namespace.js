const express = require('express');

const router = express.Router();
const {
  namespacePage, createNamespace, invitePeopleToNamespace, updateNamespace,
} = require('../controller/namespace');
const { checkTokenExpired } = require('../middleware/checkTokenExpired');

router.get('/', checkTokenExpired, namespacePage);

router.post('/', createNamespace);

router.put('/', updateNamespace);

router.post('/people', invitePeopleToNamespace);

module.exports = router;
