var express = require('express');
var router = express.Router();
const { activateUser } = require('../controller/activateUser');
/* GET home page. */
router.get('/', activateUser);

module.exports = router;
