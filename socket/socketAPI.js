const socket_io = require('socket.io');
const { insertChatMessage } = require('../model/chatContent');
const { saveCacheMessage } = require('../db/redis');

let roomUsersPair = {};
let socketio = {};
// 用來記錄當前 socket 進到的 roomId，作為斷線時移除使用
let currentSelectedRoomId = 0;
// 獲取io
socketio.getSocketio = function (server) {
  const io = socket_io.listen(server);
  io.on('connection', function (socket) {
    // 有人連線進該房間
    socket.on('changeRoom', function (roomDetailInfo, callback) {
      const { roomId } = roomDetailInfo.joinRoomInfo;
      currentSelectedRoomId = roomId;
      // 如果該房間都還沒有會員進入
      if (!roomUsersPair[roomId]) {
        roomUsersPair[roomId] = [];
      }
      // console.log(`切換房間加入房間${roomId}的人`, roomDetailInfo.userInfo);
      roomDetailInfo.userInfo.socketId = socket.id;
      roomUsersPair[roomId].push(roomDetailInfo.userInfo);
      socket.join(roomId);
      // console.log('離開前房間跟用戶的狀況', roomUsersPair)
      // 2. 離開舊房間的處理
      const leaveRoomId = roomDetailInfo.lastChooseRoom.roomId;
      if (roomUsersPair[leaveRoomId]) {
        // 移除
        const removeIndex = roomUsersPair[leaveRoomId].findIndex(user => {
          return user.userId === roomDetailInfo.userInfo.userId
        })
        if (removeIndex !== -1) {
          roomUsersPair[leaveRoomId].splice(removeIndex, 1);
          console.log('剛剛移除後房間剩下的', roomUsersPair[roomId])
          socket.leave(leaveRoomId);
        }
      }
      console.log('離開後房間跟用戶的狀況', roomUsersPair);
      // 代表都完成了
      callback('finished');
    });

    socket.on('join', (joinInfo) => {
      const { roomId } = joinInfo.roomInfo;
      currentSelectedRoomId = roomId;
      joinInfo.userInfo.socketId = socket.id;
      // 如果該房間都還沒有會員進入
      if (!roomUsersPair[roomId]) {
        roomUsersPair[roomId] = [];
      }
      console.log(`加入房間${roomId}的人`, joinInfo.userInfo);
      roomUsersPair[roomId].push(joinInfo.userInfo);

      socket.join(roomId);
    })

    socket.on('clientMessage', async (dataFromClient) => {
      // 儲存訊息到 mySQL
      const messageObj = {
        createdTime: dataFromClient.messageTime,
        messageContent: dataFromClient.messageContent,
        userId: dataFromClient.userInfo.userId,
        roomId: dataFromClient.roomDetail.roomId,
        messageType: dataFromClient.messageType
      }
      try {
        const createMessageResult = await insertChatMessage(messageObj);
        if (createMessageResult) {
          dataFromClient.messageId = createMessageResult.insertId;
          // 儲存成功發送出去，並存到 redis
          saveCacheMessage(dataFromClient);
          io.to(dataFromClient.roomDetail.roomId).emit('message', dataFromClient);
          // 要讓不在該房間的但擁有該房間的用戶可以收到通知，利用 broadcast
          socket.broadcast.emit('newMessageMention', {
            newMessageRoomId: dataFromClient.roomDetail.roomId 
          })
        }
      } catch (error) {
        throw error;
      }
    })

    socket.on('draw', async (drawInfoFromClient) => {
      io.to(drawInfoFromClient.roomDetail.roomId).emit('showDrawData', drawInfoFromClient);
    })

    socket.on('erase', (eraseInfo) => {
      io.to(eraseInfo.roomDetail.roomId).emit('eraseDrawData', eraseInfo);
    })

    socket.on('canvasClear', async (clearCanvasMsg) => {
      io.to(clearCanvasMsg.roomDetail.roomId).emit('clearDrawContent', clearCanvasMsg);
    })

    socket.on('disconnect', () => {
      if (roomUsersPair[currentSelectedRoomId]) {
        const removeIndex = roomUsersPair[currentSelectedRoomId].findIndex(user => {
          return user.socketId === socket.id;
        });
        if (removeIndex !== -1) {
          roomUsersPair[currentSelectedRoomId].splice(removeIndex, 1);
          console.log('斷線後房間剩下的', roomUsersPair[currentSelectedRoomId])
          socket.leave(currentSelectedRoomId);
        }  
      }
    })
  })
};

module.exports = socketio;
