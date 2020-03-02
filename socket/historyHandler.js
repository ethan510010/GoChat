
const { listSpecifiedRoomMessages } = require('../model/message');
const getHistory = (socketHandlerObj) => {
  const { socket } = socketHandlerObj;
  socket.on('getRoomHistory', async (dataFromClient) => {
    const { roomId, userSelectedLanguge, page, changeRoomMode } = dataFromClient;
    // 先從 redis 取，如果 redis 沒有再從 mySQL 取
    // const messagesCache = await getMessagesCache(roomId, userSelectedLanguge, page);
    // console.log('快取歷史訊息', messagesCache);
    const messages = await listSpecifiedRoomMessages(roomId, userSelectedLanguge, page);
    socket.emit('showHistory', {
      messages,
      changeRoomMode
    });
    // if (messagesCache.length > 0) {
    //   console.log('從快取取值');
    //   socket.emit('showHistory', {
    //     messages: messagesCache,
    //     changeRoomMode
    //   });
    // } else {
    //   socket.emit('showHistory', {
    //     messages,
    //     changeRoomMode
    //   });
    // }
  })
}

module.exports = {
  getHistory
}