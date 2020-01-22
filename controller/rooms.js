const { insertNewRoom } = require('../model/rooms')

const createNewRoom = async (req, res) => {
  const { channelName, userIdList } = req.body;
  const createRoomResults = await insertNewRoom(channelName, userIdList);
  if (createRoomResults.length > 0) {
    res.status(200).json({
      data: createRoomResults
    })
  } else {
    res.status(200).json({
      data: '新增 Room 有問題'
    })
  }
}

module.exports = {
  createNewRoom
}