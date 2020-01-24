const { listSpecifiedRoomMessages } = require('../model/message');

const getMessagesForEachRoom = async (req, res) => {
  const { roomId } = req.query;
  try {
    const messageResult = await listSpecifiedRoomMessages(roomId);  
    res.status(200).json({
      data: messageResult
    })
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getMessagesForEachRoom
}