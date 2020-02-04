const socket_io = require('socket.io');
const { insertChatMessage } = require('../model/chatContent');
const { saveCacheMessage } = require('../db/redis');
const { translationPromise } = require('../common/common');

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
      console.log('傳過來的 dataFromClient', dataFromClient);
      // 每個房間現在有哪些語系
      console.log('roomUserPair', roomUsersPair)
      let languageListForEachRoom = roomUsersPair[dataFromClient.roomDetail.roomId].map(function (user) {
        return user.selectedLanguage;
      });
      console.log(`房間${dataFromClient.roomDetail.roomId}有${languageListForEachRoom}語系`)
      try {
        const createMessageResult = await insertChatMessage(messageObj, languageListForEachRoom);
        if (createMessageResult) {
          dataFromClient.messageId = createMessageResult.insertId;
          dataFromClient.roomLanguages = languageListForEachRoom;
          // 儲存成功發送出去，並存到 redis
          saveCacheMessage(dataFromClient);
          // 這邊要做翻譯，根據拿到房間裡面有哪些語系，需要做翻譯
          let languageVersionMessageList = [];
          // 只有文字類的訊息要做翻譯，圖片就傳回原始 url
          if (dataFromClient.messageType === 'text') {
            for (let index = 0; index < languageListForEachRoom.length; index++) {
              const eachLanguage = languageListForEachRoom[index];
              const translateResult = await translationPromise(dataFromClient.messageContent, eachLanguage);
              languageVersionMessageList.push(translateResult.originalText);
              languageVersionMessageList.push(translateResult.translatedText);
            }
            // 把重複的語言濾掉 (這裡面已經包含原始訊息了)
            dataFromClient.chatMsgResults = Array.from(new Set(languageVersionMessageList));  
          } else if (dataFromClient.messageType === 'image') {
            // 圖片的話就傳回原始訊息
            dataFromClient.chatMsgResults = [dataFromClient.messageContent];
          }
          io.to(dataFromClient.roomDetail.roomId).emit('message', dataFromClient);
        }
      } catch (error) {
        throw error;
      }
    })

    socket.on('draw', async (drawInfoFromClient) => {
      io.to(drawInfoFromClient.roomDetail.roomId).emit('showDrawData', drawInfoFromClient);
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
