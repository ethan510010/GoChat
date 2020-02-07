const socket_io = require('socket.io');
const { insertChatMessage } = require('../model/chatContent');
const { saveTranslatedContent, listSpecifiedRoomMessages } = require('../model/message');
const { updateUserSelectedRoom } = require('../model/users');
const { saveCacheMessage } = require('../db/redis');
const { translationPromise } = require('../common/common');
require('dotenv').config();
const aws = require('aws-sdk');
aws.config.update({
  secretAccessKey: process.env.awsSecretKey,
  accessKeyId: process.env.awsAccessKeyId,
  region: 'us-east-2',
})
const s3Bucket = new aws.S3({
  params: {
    Bucket: 'ethangochat'
  }
})


let roomUsersPair = {};
let socketio = {};
// 用來記錄當前 socket 進到的 roomId，作為斷線時移除使用
let currentSelectedRoomId = 0;
// 獲取io
socketio.getSocketio = function (server) {
  const io = socket_io.listen(server);
  io.on('connection', function (socket) {
    // 有人連線進該房間
    socket.on('changeRoom', async (roomDetailInfo, callback) => {
      const { roomId } = roomDetailInfo.joinRoomInfo;
      // 更新使用者最後選到的房間
      const updateRoomResult = await updateUserSelectedRoom(roomDetailInfo.userInfo.userId, roomId);
      if (updateRoomResult) {
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
      }
    });

    socket.on('join', (joinInfo, callback) => {
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
      callback(joinInfo);
    })

    socket.on('clientMessage', async (dataFromClient) => {
      // 儲存訊息到 mySQL
      let messageObj = {
        createdTime: dataFromClient.messageTime,
        messageContent: dataFromClient.messageContent,
        userId: dataFromClient.userInfo.userId,
        roomId: dataFromClient.roomDetail.roomId,
        messageType: dataFromClient.messageType,
        fileName: dataFromClient.fileName
      }
      if (dataFromClient.messageType === 'text') {
        try {
          const createMessageResult = await insertChatMessage(messageObj);
          if (createMessageResult) {
            dataFromClient.messageId = createMessageResult.insertId;
            // 儲存成功發送出去，並存到 redis
            // saveCacheMessage(dataFromClient);
            // debug 用
            io.sockets.emit('message', dataFromClient);
            // io.to(dataFromClient.roomDetail.roomId).emit('message', dataFromClient);
            // 要讓不在該房間的但擁有該房間的用戶可以收到通知，利用 broadcast (新訊息提示功能)
            socket.broadcast.emit('newMessageMention', {
              newMessageRoomId: dataFromClient.roomDetail.roomId,
              messageTime: dataFromClient.messageTime
            })
          }
        } catch (error) {
          throw error;
        }
      } else if (dataFromClient.messageType === 'image') {
        const buffer = new Buffer.from(dataFromClient.messageContent.replace(/^data:image\/\w+;base64,/, ""), 'base64');
        // Getting the file type, ie: jpeg, png or gif
        const type = dataFromClient.messageContent.split(';')[0].split('/')[1];
        const uploadS3Paras = {
          Key: `${dataFromClient.messageTime}_${dataFromClient.fileName}`,
          Body: buffer,
          ACL: 'public-read',
          ContentEncoding: 'base64',
          // ContentType: `image/${type}` // 為了讓使用者點擊可以直接下載
        }
        const { Key } = await s3Bucket.upload(uploadS3Paras).promise();
        messageObj.messageContent = `https://d23udu0vnjg8rb.cloudfront.net/${Key}`;
        const createMessageResult = await insertChatMessage(messageObj);
        if (createMessageResult) {
          dataFromClient.messageId = createMessageResult.insertId;
          // 儲存成功發送出去，並存到 redis
          // saveCacheMessage(dataFromClient);
          // 如果下面沒更改會是一開始傳進來的 base 64 字串
          dataFromClient.messageContent = `https://d23udu0vnjg8rb.cloudfront.net/${Key}`;
          // debug 用
          io.sockets.emit('message', dataFromClient);
          // io.to(dataFromClient.roomDetail.roomId).emit('message', dataFromClient);
          // 要讓不在該房間的但擁有該房間的用戶可以收到通知，利用 broadcast (新訊息提示功能)
          socket.broadcast.emit('newMessageMention', {
            newMessageRoomId: dataFromClient.roomDetail.roomId,
            messageTime: dataFromClient.messageTime
          })
        }
      }
    })

    socket.on('translateMessage', async (dataFromClient) => {
      try {
        // 如果訊息的 type 不是 text，就不需要進到 translationPromise
        let translatedWordObj = {};
        if (dataFromClient.messageType === 'text') {
          translatedWordObj = await translationPromise(dataFromClient.messageContent, dataFromClient.languageList);
        } else if (dataFromClient.messageType === 'image') {
          translatedWordObj = {
            translatedText: dataFromClient.messageContent
          }
        }
        const insertTranslatedMsg = await saveTranslatedContent({
          messageId: dataFromClient.messageId,
          language: dataFromClient.languageList,
          translatedContent: translatedWordObj.translatedText
        });
        if (insertTranslatedMsg) {
          // debug 用
          io.to(dataFromClient.roomId).emit('saveTranslatedMessageFinish', {
            messageFromUser: dataFromClient.fromUserId,
            messageUserName: dataFromClient.name,
            messageUserAvatar: dataFromClient.avatarUrl,
            originalMessage: dataFromClient.messageContent,
            language: dataFromClient.languageList,
            translatedWord: translatedWordObj.translatedText,
            messageTime: dataFromClient.createdTime,
            messageType: dataFromClient.messageType
          })
          // socket.emit('saveTranslatedMessageFinish', {
          //   messageFromUser: dataFromClient.fromUserId,
          //   messageUserName: dataFromClient.name,
          //   messageUserAvatar: dataFromClient.avatarUrl,
          //   originalMessage: dataFromClient.messageContent,
          //   translatedWord: translatedWordObj.translatedText,
          //   messageTime: dataFromClient.createdTime,
          //   messageType: dataFromClient.messageType
          // })
        }
      } catch (error) {
        console.log(error);
      }
    })

    // 房間歷史訊息
    socket.on('getRoomHistory', async (dataFromClient) => {
      const { roomId, userSelectedLanguge, page, changeRoomMode } = dataFromClient;
      const messages = await listSpecifiedRoomMessages(roomId, userSelectedLanguge, page);
      socket.emit('showHistory', {
        messages,
        changeRoomMode
      });
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
