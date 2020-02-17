const { insertNewRoom, getRooms, updateRoom } = require('../model/rooms')

const createNewRoom = async (req, res) => {
  const { channelName, namespaceId, userIdList } = req.body;
  try {
    const { channelId, allUsers, bindingNamespaceId } = await insertNewRoom(channelName, namespaceId, userIdList);
    res.status(200).json({
      data: {
        channelId,
        bindingNamespaceId,
        allUsers
      }
    })
  } catch (error) {
    res.status(500).send('創建房間失敗');
  }
}

const listRooms = async (req, res) => {
  try {
    const { userId } = req.query;
    const roomList = await getRooms(userId);
    res.status(200).json({
      data: roomList
    })
  } catch (error) {
    res.status(500).send(error.message);
  }
}

const updateRoomMember = async (req, res) => {
  try {
    const { roomId, userIdList } = req.body;
    console.log('被新增進房間的用戶', userIdList)
    const updateResult =  await updateRoom(roomId, userIdList);
    res.status(200).json({
      data: updateResult
    })
  } catch (error) {
    res.status(500).send(error.message);
  }
}

module.exports = {
  createNewRoom,
  listRooms,
  updateRoomMember
}