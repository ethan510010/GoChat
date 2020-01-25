const socket_io = require('socket.io');
const { insertChatMessage } = require('../model/chatContent');
const { saveCacheMessage } = require('../db/redis');

let roomUsersPair = {};
let socketio = {};
// 獲取io
socketio.getSocketio = function(server) {
  const io = socket_io.listen(server);
  io.on('connection', function(socket) {
    console.log('a user connected')
    // 有人連線進該房間
    socket.on('join', (joinInfo) => {
      // console.log("房間", joinInfo.roomInfo);
      const { roomId, roomTitle }  = joinInfo.roomInfo;
      // console.log('用戶資料', joinInfo.userInfo);
      // 如果該房間都還沒有會員進入
      if (!roomUsersPair[roomId]) {
        roomUsersPair[roomId] = [];
      }
      roomUsersPair[roomId].push(joinInfo.userInfo);
      socket.join(roomId);
    })

    socket.on('leave', (leaveInfo) => {
      if (leaveInfo.lastChooseRoom.roomId !== -1) {
        const { lastChooseRoom, userInfo } = leaveInfo;
        const { roomId, roomTitle }  = lastChooseRoom; 
        // 因為 javascript 無法直接用 indexOf 比較 object，所以這邊利用 userId 來找
        const roomUserIdPairList = roomUsersPair[roomId].map(function(user) {
          return user.userId;
        })
        const leaveUserIndex = roomUserIdPairList.indexOf(userInfo.userId);
        if (roomUsersPair[roomId].length > 0 && leaveUserIndex !== -1) {
          roomUsersPair[roomId].splice(leaveUserIndex, 1);
          socket.leave(roomId);
        }
      }
    })

    socket.on('clientMessage', async (dataFromClient) => {
      // 儲存訊息到 mySQL
      const messageObj = {
        createdTime: dataFromClient.messageTime,
        messageContent: dataFromClient.messageContent,
        userId: dataFromClient.userInfo.userId,
        roomId: dataFromClient.roomDetail.roomId
      }
      console.log('傳過來的 dataFromClient', dataFromClient)
      try {
        const createMessageResult = await insertChatMessage(messageObj);
        if (createMessageResult) {
          dataFromClient.messageId = createMessageResult.insertId;
          // 儲存成功發送出去，並存到 redis
          saveCacheMessage(dataFromClient);
          io.to(dataFromClient.roomDetail.roomId).emit('message', dataFromClient);    
        }
      } catch (error) {
        throw error;
      }
    })
  })
};

module.exports = socketio;
