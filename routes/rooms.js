var express = require('express');
var router = express.Router();
const { createNewRoom, listRooms } = require('../controller/rooms');

router.post('/createRoom', createNewRoom);

router.get('/getRooms', listRooms);

module.exports = router;