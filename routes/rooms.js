var express = require('express');
var router = express.Router();
const { createNewRoom } = require('../controller/rooms');

router.post('/createRoom', createNewRoom)

module.exports = router;