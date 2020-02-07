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
// 用來處理要存到 redis cache 的每一筆資料
let messageRedisCache = {};
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
      if (dataFromClient.messageType === 'image') {
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
      }
      try {
        const createMessageResult = await insertChatMessage(messageObj);
        if (createMessageResult) {
          dataFromClient.messageId = createMessageResult.insertId;
          const languageArrangement = ['en', 'zh-TW', 'ja', 'es'];
          if (dataFromClient.messageType === 'text') {
            const englishPromise = translationPromise(dataFromClient.messageContent, 'en');
            const chinesePromise = translationPromise(dataFromClient.messageContent, 'zh-TW');
            const japanesePromise = translationPromise(dataFromClient.messageContent, 'ja');
            const spanishPromise = translationPromise(dataFromClient.messageContent, 'es');
            const transList = await Promise.all([englishPromise, chinesePromise, japanesePromise, spanishPromise]);
            for (let i = 0; i < transList.length; i++) {
              const eachTransResult = transList[i].translatedText;
              const eachLanguage = languageArrangement[i];
              await saveTranslatedContent({
                messageId: createMessageResult.insertId,
                language: eachLanguage,
                translatedContent: eachTransResult
              });
              dataFromClient[eachLanguage] = eachTransResult;
            }
          } else if (dataFromClient.messageType === 'image') {
            for (let i = 0; i < languageArrangement.length; i++) {
              const eachLanguage = languageArrangement[i];
              await saveTranslatedContent({
                messageId: createMessageResult.insertId,
                language: eachLanguage,
                translatedContent: messageObj.messageContent
              })
            }
          }

          // 儲存成功發送出去，並存到 redis
          // saveCacheMessage(dataFromClient);
          // 組裝 redis cache 結構
          messageRedisCache.messageContent = dataFromClient.messageContent;
          messageRedisCache.createdTime = dataFromClient.messageTime,
          messageRedisCache.userId = dataFromClient.userInfo.userId;
          messageRedisCache.messageType = dataFromClient.messageType;
          messageRedisCache.messageId = createMessageResult.insertId;
          messageRedisCache.provider = dataFromClient.userInfo.provider;
          messageRedisCache.name = dataFromClient.userInfo.name;
          messageRedisCache.email = dataFromClient.userInfo.email;
          messageRedisCache.avatarUrl = dataFromClient.userInfo.avatarUrl;
          messageRedisCache.translatedList = [];
          // debug 用
          io.to(dataFromClient.roomDetail.roomId).emit('message', dataFromClient);
          // 要讓不在該房間的但擁有該房間的用戶可以收到通知，利用 broadcast (新訊息提示功能)
          socket.broadcast.emit('newMessageMention', {
            newMessageRoomId: dataFromClient.roomDetail.roomId,
            messageTime: dataFromClient.messageTime
          })
        }
      } catch (error) {
        throw error;
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

const clearMessageCache = (messageCache) => {
  messageCache = {};
}

module.exports = socketio;
