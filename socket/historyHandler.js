const { getMessagesCache } = require('../model/message');
const { listSpecifiedRoomMessages } = require('../model/message');

const getHistory = (socketHandlerObj) => {
  const { socket } = socketHandlerObj;
  socket.on('getRoomHistory', async (dataFromClient) => {
    const {
      roomId, userSelectedLanguge, page, changeRoomMode,
    } = dataFromClient;
    // 先從 redis 取，如果 redis 沒有再從 mySQL 取
    try {
      const messagesCache = await getMessagesCache(roomId, userSelectedLanguge, page);
      const messages = await listSpecifiedRoomMessages(roomId, userSelectedLanguge, page);
      if (messagesCache.length >= 30) {
        console.log('從快取取值');
        socket.emit('showHistory', {
          messages: messagesCache,
          changeRoomMode,
        });
      } else {
        console.log('從 mysql 取值');
        socket.emit('showHistory', {
          messages,
          changeRoomMode,
        });
      }
    } catch (error) {
      socket.emit('customError', error);
    }
  });
};

module.exports = {
  getHistory,
};
