var express = require('express');
var router = express.Router();
const { createNewRoom, listRooms, updateRoomMember } = require('../controller/rooms');

router.post('/createRoom', createNewRoom);

router.get('/getRooms', listRooms);

router.put('/updateRoomMember', updateRoomMember);

module.exports = router;