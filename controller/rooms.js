const { insertNewRoom, getRooms } = require('../model/rooms')

const createNewRoom = async (req, res) => {
  const { channelName, userIdList } = req.body;
  try {
    const { channelId, allUsers } = await insertNewRoom(channelName, userIdList);
    res.status(200).json({
      data: {
        channelId,
        allUsers
      }
    })
  } catch (error) {
    res.status(500).send('創建房間失敗');
  }
}

const listRooms = async (req, res) => {
  try {
    const roomList = await getRooms();
    res.status(200).json({
      data: roomList
    })
  } catch (error) {
    res.status(500).send(error.message);
  }
}

module.exports = {
  createNewRoom,
  listRooms
}