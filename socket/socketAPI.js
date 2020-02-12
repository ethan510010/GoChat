const socket_io = require('socket.io');
const { insertChatMessage } = require('../model/chatContent');
const { saveTranslatedContent, listSpecifiedRoomMessages, getMessagesCache } = require('../model/message');
const { handleRoomCanvasImage, getRoomCanvasImg, deleteRoomCanvas } = require('../model/canvas');
const { updateUserSelectedRoom } = require('../model/users');
const { saveCacheMessage } = require('../db/redis');
const { translationPromise } = require('../common/common');
const { userLeaveRoom } = require('../model/rooms');
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
// 用來記錄當前 room 跟 peerId 的 list
let roomPeerIdList = {};
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
        // 配合 webRTC 生成
        if (!roomPeerIdList[roomId]) {
          roomPeerIdList[roomId] = [];
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
      const peerId = joinInfo.peerId;
      currentSelectedRoomId = roomId;
      joinInfo.userInfo.socketId = socket.id;
      // 如果該房間都還沒有會員進入
      if (!roomUsersPair[roomId]) {
        roomUsersPair[roomId] = [];
      }

      // 配合 WebRTC
      if (!roomPeerIdList[roomId]) {
        roomPeerIdList[roomId] = [];
      }

      console.log(`加入房間${roomId}的人`, joinInfo.userInfo);
      roomUsersPair[roomId].push(joinInfo.userInfo);

      socket.join(roomId);

      // WebRTC 事件
      roomPeerIdList[roomId].push({
        peerId: peerId,
        user: joinInfo.userInfo
      });
      console.log('現有的allPeers', roomPeerIdList);
      io.to(roomId).emit('allPeersForRoom', {
        roomId: roomId,
        allPeersForRoom: roomPeerIdList[roomId]
      })
      callback(joinInfo);
    })

    socket.on('clientMessage', async (dataFromClient) => {
      // 用來處理要存到 redis cache 的每一筆資料
      let messageRedisCache = {};
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
              messageRedisCache[eachLanguage] = eachTransResult;
            }
          } else if (dataFromClient.messageType === 'image') {
            for (let i = 0; i < languageArrangement.length; i++) {
              const eachLanguage = languageArrangement[i];
              await saveTranslatedContent({
                messageId: createMessageResult.insertId,
                language: eachLanguage,
                translatedContent: messageObj.messageContent
              });
              messageRedisCache[eachLanguage] = messageObj.messageContent;
            }
          }

          // 組裝 redis cache 結構 (翻譯的部分在上面組裝)
          messageRedisCache.messageContent = messageObj.messageContent;
          messageRedisCache.createdTime = messageObj.createdTime,
            messageRedisCache.userId = messageObj.userId;
          messageRedisCache.messageType = messageObj.messageType;
          messageRedisCache.messageId = createMessageResult.insertId;
          messageRedisCache.provider = dataFromClient.userInfo.provider;
          messageRedisCache.name = dataFromClient.userInfo.name;
          messageRedisCache.email = dataFromClient.userInfo.email;
          messageRedisCache.avatarUrl = dataFromClient.userInfo.avatarUrl;
          messageRedisCache.roomId = dataFromClient.roomDetail.roomId;
          console.log('組裝的 cache 訊息', messageRedisCache);
          // 儲存成功發送出去，並存到 redis
          saveCacheMessage(messageRedisCache);
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
      // 先從 redis 取，如果 redis 沒有再從 mySQL 取
      const messagesCache = await getMessagesCache(roomId, userSelectedLanguge, page);
      // console.log('快取歷史訊息', messagesCache);
      const messages = await listSpecifiedRoomMessages(roomId, userSelectedLanguge, page);
      if (messagesCache.length > 0) {
        console.log('從快取取值');
        socket.emit('showHistory', {
          messages: messagesCache,
          changeRoomMode
        });
      } else {
        socket.emit('showHistory', {
          messages,
          changeRoomMode
        });
      }
    })

    // canvas 歷史畫面
    socket.on('getRoomCanvas', async (dataFromClient) => {
      const { roomId } = dataFromClient;
      const canvasUrl = await getRoomCanvasImg(roomId);
      socket.emit('showCanvas', { canvasUrl, roomId });
    })

    socket.on('draw', async (drawInfoFromClient) => {
      io.to(drawInfoFromClient.roomDetail.roomId).emit('showDrawData', drawInfoFromClient);
    })

    socket.on('erase', (eraseInfo) => {
      io.to(eraseInfo.roomDetail.roomId).emit('eraseDrawData', eraseInfo);
    })

    socket.on('canvasClear', async (clearCanvasMsg) => {
      // 把 DB 中該圖刪掉
      await deleteRoomCanvas(clearCanvasMsg.roomDetail.roomId);
      io.to(clearCanvasMsg.roomDetail.roomId).emit('clearDrawContent', clearCanvasMsg);
    })

    socket.on('eachTimeDraw', async (eachTimeDrawResult) => {
      // 結果為一個 base64 的圖片
      const buffer = new Buffer.from(eachTimeDrawResult.drawPathUrl.replace(/^data:image\/\w+;base64,/, ""), 'base64');
      // Getting the file type, ie: jpeg, png or gif
      const type = eachTimeDrawResult.drawPathUrl.split(';')[0].split('/')[1];
      const uploadS3Paras = {
        Key: `${Date.now()}_canvas${eachTimeDrawResult.roomDetail.roomId}`,
        Body: buffer,
        ACL: 'public-read',
        ContentEncoding: 'base64',
        ContentType: `image/${type}`
      }
      const { Key } = await s3Bucket.upload(uploadS3Paras).promise();
      // 存到 DB
      const canvasImagePath = `https://d23udu0vnjg8rb.cloudfront.net/${Key}`;
      try {
        const handleCanvas = await handleRoomCanvasImage({
          roomId: eachTimeDrawResult.roomDetail.roomId,
          canvasUrl: canvasImagePath
        })
      } catch (error) {
        console.log('儲存及更新 canvas 有問題')
      }
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
      // 移除 WebRTC 裡面的配對 peerId
      if (roomPeerIdList[currentSelectedRoomId]) {
        for (let i = 0; i < roomPeerIdList[currentSelectedRoomId].length; i++) {
          const element = roomPeerIdList[currentSelectedRoomId][i];
          console.log('element' ,element.user.socketId)
        }
        const removeIndex = roomPeerIdList[currentSelectedRoomId].findIndex(eachPeerDetailInfo => {
          return eachPeerDetailInfo.user.socketId === socket.id;
        });
        if (removeIndex !== -1) {
          roomPeerIdList[currentSelectedRoomId].splice(removeIndex, 1);
          console.log('斷線後剩下的 peer', roomPeerIdList)
        }
      }
    })

    // 用戶退群 (如果全部人都退出這個房間，就把該 room 刪掉)
    socket.on('leaveRoom', async (dataFromClient) => {
      const leaveRoomId = dataFromClient.leaveRoom.roomId;
      const leaveUserId = dataFromClient.leaveUser.userId;
      const leaveResult = await userLeaveRoom(leaveRoomId, leaveUserId);
      if (leaveResult) {
        io.to(leaveRoomId).emit('leaveRoomNotification', {
          leaveUser: dataFromClient.leaveUser,
          leaveRoom: dataFromClient.leaveRoom
        })
        // if (roomUsersPair[leaveRoomId]) {
        //   // 移除
        //   io.to(leaveRoomId).emit('leaveRoomNotification', {
        //     leaveUser: dataFromClient.leaveUser,
        //     leaveRoom: dataFromClient.leaveRoom
        //   })
        //   const removeIndex = roomUsersPair[leaveRoomId].findIndex(user => {
        //     return user.userId === leaveUserId
        //   })
        //   if (removeIndex !== -1) {
        //     roomUsersPair[leaveRoomId].splice(removeIndex, 1);
        //     socket.leave(leaveRoomId);
        //     console.log('退群後房間剩下的', roomUsersPair);
        //   }
        // }

      }
    })

    // WebRTC
    // socket.on('sendPeerId', (peerInfo) => {
    //   const { peerId, userId, roomId } = peerInfo;
    //   roomPeerIdList[roomId].push(peerId);
    //   io.to(roomId).emit('allPeersForRoom', {
    //     roomId: roomId,
    //     allPeersForRoom: roomPeerIdList[roomId]
    //   })
    // })
    // WebRTC 相關 
    // let broadCaster;
    // socket.on('broadcastVideo', () => {
    //   // broadCaster = socket.id;
    //   socket.broadcast.emit('videoBroadcast', socket.id)
    //   // console.log('廣播者', broadCaster)
    // })

    // socket.on('watcher', (broadCaster) => {
    //   console.log('廣播者', broadCaster)
    //   socket.to(broadCaster).emit('watcher', socket.id);
    // })

    // socket.on('candidate', (id, message) => {
    //   socket.to(id).emit('candidate', socket.id, message);
    // })

    // socket.on('offer', (id, message) => {
    //   socket.to(id).emit('offer', socket.id, message);
    // })

    // socket.on('answer', (id, message) => {
    //   socket.to(id).emit('answer', socket.id, message);
    // })

    // 測試2
    // socket.on('offer', function (data) {
    //   socket.broadcast.emit('offer', { sdp: data.sdp, remotePC: data.remotePeerConnection });
    // });
    // // 如果有接收到answer 訊息，立即傳送廣播封包，發送answer 訊息給client 端
    // socket.on('answer', function (data) {
    //   socket.broadcast.emit('answer', { sdp: data.sdp });
    // });
    // // 如果有接收到ice 訊息，立即傳送廣播封包，發送ice 訊息給client 端
    // socket.on('ice', function (data) {
    //   socket.broadcast.emit('ice', { candidate: data.candidate });
    // });
    // // 如果有接收到hangup 訊息，立即傳送廣播封包，發送hangup訊息給client 端
    // socket.on('hangup', function () {
    //   socket.broadcast.emit('hangup', {});
    // });
  })
};

module.exports = socketio;
