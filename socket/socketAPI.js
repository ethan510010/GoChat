const socket_io = require('socket.io');
const { insertChatMessage } = require('../model/chatContent');
const { saveCacheMessage } = require('../db/redis');
const { translationPromise } = require('../common/common');

let roomUsersPair = {};
let socketio = {};
// 獲取io
socketio.getSocketio = function (server) {
  const io = socket_io.listen(server);
  io.on('connection', function (socket) {
    console.log('a user connected')
    // 有人連線進該房間
    socket.on('join', (joinInfo) => {
      // console.log("房間", joinInfo.roomInfo);
      const { roomId } = joinInfo.roomInfo;
      // 如果該房間都還沒有會員進入
      if (!roomUsersPair[roomId]) {
        roomUsersPair[roomId] = [];
      }
      console.log(`加入房間${roomId}的人`, joinInfo.userInfo);
      roomUsersPair[roomId].push(joinInfo.userInfo);
      socket.join(roomId);
    })

    socket.on('leave', (leaveInfo) => {
      if (leaveInfo.lastChooseRoom.roomId !== -1) {
        const { lastChooseRoom, userInfo } = leaveInfo;
        const { roomId } = lastChooseRoom;
        // 因為 javascript 無法直接用 indexOf 比較 object，所以這邊利用 userId 來找
        if (roomUsersPair[roomId]) {
          const roomUserIdPairList = roomUsersPair[roomId].map(function(user) {
            return user.userId;
          });
          const leaveUserIndex = roomUserIdPairList.indexOf(userInfo.userId);
          console.log('leaveUserIndex', leaveUserIndex);
          if (roomUsersPair[roomId].length > 0 && leaveUserIndex !== -1) {
            roomUsersPair[roomId].splice(leaveUserIndex, 1);
            console.log('欲移除的對象', roomUsersPair)
            socket.leave(roomId);
          }  
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
      console.log('傳過來的 dataFromClient', dataFromClient);
      // 每個房間現在有哪些語系
      console.log(roomUsersPair)
      const languageListForEachRoom = roomUsersPair[dataFromClient.roomDetail.roomId].map(function(user) {
        return user.selectedLanguage;
      });
      try {
        const createMessageResult = await insertChatMessage(messageObj, languageListForEachRoom);
        if (createMessageResult) {
          dataFromClient.messageId = createMessageResult.insertId;
          dataFromClient.roomLanguages = languageListForEachRoom;
          // 儲存成功發送出去，並存到 redis
          saveCacheMessage(dataFromClient);
          // 這邊要做翻譯，根據拿到房間裡面有哪些語系，需要做翻譯
          let languageVersionMessageList = [];
          for (let index = 0; index < languageListForEachRoom.length; index++) {
            const eachLanguage = languageListForEachRoom[index];
            const translateResult = await translationPromise(dataFromClient.messageContent, eachLanguage);
            languageVersionMessageList.push(translateResult.originalText);
            languageVersionMessageList.push(translateResult.translatedText);
          }
          // 把重複的語言濾掉
          dataFromClient.translateResults = Array.from(new Set(languageVersionMessageList));
          io.to(dataFromClient.roomDetail.roomId).emit('message', dataFromClient);
        }
      } catch (error) {
        throw error;
      }
    })
  })
};

module.exports = socketio;
