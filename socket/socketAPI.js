const socket_io = require('socket.io');
const { insertChatMessage } = require('../model/chatContent');
const { saveTranslatedContent, listSpecifiedRoomMessages } = require('../model/message');
const { updateUserLanguage } = require('../model/language');
const { handleRoomCanvasImage, getRoomCanvasImg, deleteRoomCanvas } = require('../model/canvas');
const { 
  updateUserSelectedRoom, 
  getUsersOfRoom, 
  getUsersOfRoomExclusiveSelf, 
  updateUserNameOrAvatar, 
  getAllUsersOfNamespaceExclusiveSelf } = require('../model/users');
// const { saveCacheMessage } = require('../db/redis');
const { translationPromise } = require('../common/common');
const { userLeaveRoom, insertNewRoom, updateRoom } = require('../model/rooms');
const { listAllNamespaces } = require('../model/namespace');
require('dotenv').config();
const aws = require('aws-sdk');
aws.config.update({
  secretAccessKey: process.env.awsSecretKey,
  accessKeyId: process.env.awsAccessKeyId
})
const s3Bucket = new aws.S3({
  params: {
    Bucket: 'chatvas'
  }
})

let roomUsersPair = {};
let socketio = {};
// // 用來記錄當前 socket 進到的 roomId，作為斷線時移除使用
// let currentSelectedRoomId = 0;
// 用來記錄當前 room 跟 peerId 的 list
let roomPeerIdList = {};

async function handleBufferUpload(base64Info, fileKey) {
  const buffer = new Buffer.from(base64Info.replace(/^data:image\/\w+;base64,/, ""), 'base64');
  // Getting the file type, ie: jpeg, png or gif
  const type = base64Info.split(';')[0].split('/')[1];
  const uploadS3Paras = {
    Key: fileKey,
    Body: buffer,
    ACL: 'public-read',
    ContentEncoding: 'base64',
    // ContentType: `image/${type}` // 為了讓使用者點擊可以直接下載
  }
  const { Key } = await s3Bucket.upload(uploadS3Paras).promise();
  return `https://d1pj9pkj6g3ldu.cloudfront.net/${Key}`;
}

socketio.getSocketio = async function (server) {
  const io = socket_io(server);
  // 註冊 socket io for eachNamespace
  io.of(/^\/namespaceId=\d+$/).on('connect', function (socket) {
    // 用來記錄當前 socket 進到的 roomId，作為斷線時移除使用
    let currentSelectedRoomId = 0;
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
          user: roomDetailInfo.userInfo
        })
        socket.join(roomId);
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

        // 移除 WebRTC 裡面的配對 peerId
        if (roomPeerIdList[leaveRoomId]) {
          const removeIndex = roomPeerIdList[leaveRoomId].findIndex(eachPeerDetailInfo => {
            return eachPeerDetailInfo.user.userId === roomDetailInfo.userInfo.userId;
          });
          if (removeIndex !== -1) {
            roomPeerIdList[leaveRoomId].splice(removeIndex, 1);
          }
        }
        // console.log('離開後房間跟用戶的狀況', roomUsersPair);
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

      // console.log(`加入房間${roomId}的人`, joinInfo.userInfo);
      roomUsersPair[roomId].push(joinInfo.userInfo);

      // WebRTC 事件
      roomPeerIdList[roomId].push({
        peerId: peerId,
        user: joinInfo.userInfo
      });

      socket.join(roomId);
      console.log('加入後房間跟用戶的狀況', roomUsersPair)
      
      console.log('加入後房間的 roomPeerIdList', roomPeerIdList);
      // 全部廣播 (包含誰在線上的功能，利用 roomUsersPair 實現)
      subNamespace.emit('allPeersForRoom', {
        roomId: roomId,
        roomUsersPair: roomUsersPair,
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
        const s3Path = await handleBufferUpload(dataFromClient.messageContent, `${dataFromClient.messageTime}_${dataFromClient.fileName}`);
        messageObj.messageContent = s3Path;
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

    // 獲取房間的用戶
    socket.on('getUsersOfRoom', async (validRoomId) => {
      // 拿到切換到的房間全部的用戶
      const usersOfRoom = await getUsersOfRoom(validRoomId);
      socket.emit('showUsersOfRoom', {
        usersOfRoom,
        roomUsersPair
      });
    })

    socket.on('searchAllUsersExclusiveSelfInNamespace', async (namespaceInfo, callback) => {
      const { currentNamespaceId, userId } = namespaceInfo;
      const validAllUsers = await getAllUsersOfNamespaceExclusiveSelf(currentNamespaceId, userId);
      callback({
        validAllUsers
      })
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
      const canvasImagePath = `https://d1pj9pkj6g3ldu.cloudfront.net/${Key}`;
      try {
        const handleCanvas = await handleRoomCanvasImage({
          roomId: eachTimeDrawResult.roomDetail.roomId,
          canvasUrl: canvasImagePath
        })
      } catch (error) {
        console.log('儲存及更新 canvas 有問題')
      }
    })

    // 房間正在播放影片
    socket.on('roomIsPlaying', async (roomPlayingInfo) => {
      const { roomId, videoPlaying } = roomPlayingInfo;
      // 自己不需要接收
      socket.broadcast.to(roomId).emit('whichRoomPlayingVideo', {
        roomId,
        videoPlaying
      })
    })

    socket.on('disconnect', () => {
      if (roomUsersPair[currentSelectedRoomId]) {
        console.log('currentSelectedRoomId', currentSelectedRoomId)
        const removeIndex = roomUsersPair[currentSelectedRoomId].findIndex(user => {
          return user.socketId === socket.id;
        });
        if (removeIndex !== -1) {
          roomUsersPair[currentSelectedRoomId].splice(removeIndex, 1);
          // console.log('斷線後房間剩下的', roomUsersPair[currentSelectedRoomId])
          socket.leave(currentSelectedRoomId);
        }
      }
      console.log('有重整後的房間用戶配對', roomUsersPair);
      // 移除 WebRTC 裡面的配對 peerId
      if (roomPeerIdList[currentSelectedRoomId]) {
        console.log('currentSelectedRoomId', currentSelectedRoomId);
        const removeIndex = roomPeerIdList[currentSelectedRoomId].findIndex(eachPeerDetailInfo => {
          console.log('user', eachPeerDetailInfo.user.socketId, eachPeerDetailInfo.user.name)
          return eachPeerDetailInfo.user.socketId === socket.id;
        });
        if (removeIndex !== -1) {
          roomPeerIdList[currentSelectedRoomId].splice(removeIndex, 1);
        }
      }
      console.log('有重整後的房間peer配對', roomPeerIdList)
    })

    // 取得現在在 namespaceId 底下但不在該房間下的用戶
    socket.on('searchUsersUnderNamespaceAndNotRoom', async (dataFromClient, callback) => {
      const { roomId, selfUserId } = dataFromClient;
      const usersOfRoom = await getUsersOfRoomExclusiveSelf(roomId, selfUserId);
      callback({
        usersOfRoom
      })
    })

    // 新增房間
    socket.on('createRoom', async (newRoomInfo) => {
      const { channelName, namespaceId, userIdList } = newRoomInfo;
      const { channelId, allUsers, bindingNamespaceId } = await insertNewRoom(channelName, namespaceId, userIdList);
      // 廣播給全部人，可以即時看到被加進去的房間
      subNamespace.emit('newRoomCreated', {
        newRoom: {
          roomId: channelId,
          roomName: channelName
        },
        bindingNamespaceId,
        userIdList
      })
    })

    // 更新房間用戶
    socket.on('updateRoomMember', async (updateInfo, callback) => {
      const { inviterUserId, room, userList, newAddedMemberIdList } = updateInfo;
      await updateRoom(room.roomId, newAddedMemberIdList);
      subNamespace.emit('receiveUpdateNewMember', {
        inviterUserId,
        room,
        userList
      })
      callback({
        updateFinished: true
      })
    })

    // 更新使用者大頭貼
    socket.on('editNewAvatar', async (avatarInfo, callback) => {
      const { userInfo, avatarData, fileName } = avatarInfo;
      const s3Path = await handleBufferUpload(avatarData, `${userInfo.userId}_${Date.now()}_${fileName}`);
      await updateUserNameOrAvatar(userInfo.userId, undefined, s3Path);
      // await updateUserAvatar(userInfo.userId, s3Path);
      callback({
        newAvatarUrl: s3Path
      })
    })

    // 更新使用者姓名
    socket.on('editUserName', async (newUserInfo, callback) => {
      const { userId, newUserName } = newUserInfo;
      await updateUserNameOrAvatar(userId, newUserName, undefined);
      callback({
        newUserName
      })
    })

    // 更新使用者偏好語言
    socket.on('editUserLanguage', async (userLanguageInfo, callback) => {
      const { userId, selectedLanguage } = userLanguageInfo;
      await updateUserLanguage(userId, selectedLanguage);
      callback({
        selectedLanguage
      })
    })

    // 視訊結束
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
