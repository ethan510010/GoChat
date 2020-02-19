const socket_io = require('socket.io');
const { insertChatMessage } = require('../model/chatContent');
const { saveTranslatedContent, listSpecifiedRoomMessages } = require('../model/message');
const { handleRoomCanvasImage, getRoomCanvasImg, deleteRoomCanvas } = require('../model/canvas');
const { updateUserSelectedRoom } = require('../model/users');
// const { saveCacheMessage } = require('../db/redis');
const { translationPromise } = require('../common/common');
const { userLeaveRoom } = require('../model/rooms');
const { listAllNamespaces } = require('../model/namespace');
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

socketio.getSocketio = async function (server) {
  const io = socket_io.listen(server);
  // 註冊 socket io for eachNamespace
  io.of(/^\/namespaceId=\d+$/).on('connect', function (socket) {
    // 有人連線進來
    const subNamespace = socket.nsp;
    socket.on('changeRoom', async (roomDetailInfo, callback) => {
      const { roomId } = roomDetailInfo.joinRoomInfo;
      const { userInfo, peerId } = roomDetailInfo;
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
        // 房間加入切換到的人
        roomUsersPair[roomId].push(roomDetailInfo.userInfo);
        roomPeerIdList[roomId].push({
          peerId: peerId,
          user: userInfo
        })
        socket.join(roomId);
        console.log('目前房間跟用戶的狀況', roomUsersPair)
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

          // 移除 WebRTC 裡面的配對 peerId
          if (roomPeerIdList[leaveRoomId]) {
            const removeIndex = roomPeerIdList[leaveRoomId].findIndex(eachPeerDetailInfo => {
              console.log('element', eachPeerDetailInfo.user.userId)
              return eachPeerDetailInfo.user.userId === roomDetailInfo.userInfo.userId;
            });
            if (removeIndex !== -1) {
              roomPeerIdList[leaveRoomId].splice(removeIndex, 1);
            }
          }
        }
        console.log('離開後房間跟用戶的狀況', roomUsersPair);
        console.log('離開房間後剩下的 peer', roomPeerIdList);
        // 代表都完成了
        callback({ 
          acknowledged: true
        });
        // 全部的人都廣播
        subNamespace.emit('changeRoomPeersList', {
          roomUsersPair,
          roomPeerIdList
        })
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
      console.log('目前房間跟用戶的狀況', roomUsersPair)
      subNamespace.in(roomId).clients((err, clients) => {
        console.log(`在 roomId ${roomId} 的用戶`, clients)
      })
      // WebRTC 事件
      roomPeerIdList[roomId].push({
        peerId: peerId,
        user: joinInfo.userInfo
      });
      console.log('現有的allPeers', roomPeerIdList);
      // 全部廣播
      subNamespace.emit('allPeersForRoom', {
        roomId: roomId,
        // allPeersForRoom: roomPeerIdList[roomId]
        peersRoomPair: roomPeerIdList
      })
      callback(joinInfo);
    })

    socket.on('clientMessage', async (dataFromClient) => {
      // 用來處理要存到 redis cache 的每一筆資料
      // let messageRedisCache = {};
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
              // messageRedisCache[eachLanguage] = eachTransResult;
            }
          } else if (dataFromClient.messageType === 'image') {
            for (let i = 0; i < languageArrangement.length; i++) {
              const eachLanguage = languageArrangement[i];
              await saveTranslatedContent({
                messageId: createMessageResult.insertId,
                language: eachLanguage,
                translatedContent: messageObj.messageContent
              });
              // messageRedisCache[eachLanguage] = messageObj.messageContent;
            }
          }

          // 組裝 redis cache 結構 (翻譯的部分在上面組裝)
          // messageRedisCache.messageContent = messageObj.messageContent;
          // messageRedisCache.createdTime = messageObj.createdTime,
          //   messageRedisCache.userId = messageObj.userId;
          // messageRedisCache.messageType = messageObj.messageType;
          // messageRedisCache.messageId = createMessageResult.insertId;
          // messageRedisCache.provider = dataFromClient.userInfo.provider;
          // messageRedisCache.name = dataFromClient.userInfo.name;
          // messageRedisCache.email = dataFromClient.userInfo.email;
          // messageRedisCache.avatarUrl = dataFromClient.userInfo.avatarUrl;
          // messageRedisCache.roomId = dataFromClient.roomDetail.roomId;
          // console.log('組裝的 cache 訊息', messageRedisCache);
          // // 儲存成功發送出去，並存到 redis
          // saveCacheMessage(messageRedisCache);
          subNamespace.to(dataFromClient.roomDetail.roomId).emit('message', dataFromClient);
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

    // canvas 歷史畫面
    socket.on('getRoomCanvas', async (dataFromClient) => {
      const { roomId } = dataFromClient;
      const canvasUrl = await getRoomCanvasImg(roomId);
      socket.emit('showCanvas', { canvasUrl, roomId });
    })

    socket.on('draw', async (drawInfoFromClient) => {
      subNamespace.to(drawInfoFromClient.roomDetail.roomId).emit('showDrawData', drawInfoFromClient);
    })

    socket.on('erase', (eraseInfo) => {
      subNamespace.to(eraseInfo.roomDetail.roomId).emit('eraseDrawData', eraseInfo);
    })

    socket.on('canvasClear', async (clearCanvasMsg) => {
      // 把 DB 中該圖刪掉
      await deleteRoomCanvas(clearCanvasMsg.roomDetail.roomId);
      subNamespace.to(clearCanvasMsg.roomDetail.roomId).emit('clearDrawContent', clearCanvasMsg);
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
        const removeIndex = roomPeerIdList[currentSelectedRoomId].findIndex(eachPeerDetailInfo => {
          console.log('element', eachPeerDetailInfo.user.socketId)
          return eachPeerDetailInfo.user.socketId === socket.id;
        });
        if (removeIndex !== -1) {
          roomPeerIdList[currentSelectedRoomId].splice(removeIndex, 1);
          console.log('斷線後剩下的 peer', roomPeerIdList)
        }
      }
    })

    socket.on('broadcastVideo', (videoLauncherInfo, callback) => {
      const { videoLauncherRoomId, launchVideoUser, launchPeerId } = videoLauncherInfo;
      subNamespace.to(videoLauncherRoomId).emit('shouldOpenCallAlert', {
        videoLauncherRoomId: videoLauncherRoomId,
        videoLauncher: launchVideoUser,
        launchVideoPeerId: launchPeerId
      })
      callback({
        launchVideoPeerId: launchPeerId
      })
    })

    socket.on('shouldBeConnectedPeerId', (shouldConnectPeerInfo, callback) => {
      const { launchVideoPeerId, shouldConnectedPeerId, videoLauncherRoomId } = shouldConnectPeerInfo;
      subNamespace.to(videoLauncherRoomId).emit('shouldBeConnectedPeerId', {
        launchVideoPeerId,
        shouldConnectedPeerId,
        videoLauncherRoomId
      })
    })

    socket.on('roomPlayingVideoOver', (roomPlayingOverInfo) => {
      const { roomId, roomPlayingVideo } = roomPlayingOverInfo;
      subNamespace.emit('getRoomPlayingVideoOver', {
        finisedVideoRoomId: roomId,
        roomPlayingVideo: roomPlayingVideo
      })
    })

    // 用戶退群 (如果全部人都退出這個房間，就把該 room 刪掉)
    socket.on('leaveRoom', async (dataFromClient) => {
      const leaveRoomId = dataFromClient.leaveRoom.roomId;
      const leaveUserId = dataFromClient.leaveUser.userId;
      const leaveResult = await userLeaveRoom(leaveRoomId, leaveUserId);
      if (leaveResult) {
        subNamespace.to(leaveRoomId).emit('leaveRoomNotification', {
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
  })
};

module.exports = socketio;
