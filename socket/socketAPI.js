const socket_io = require('socket.io');
const { listSpecifiedRoomMessages } = require('../model/message');
const { handleRoomCanvasImage } = require('../model/canvas');
// const { saveCacheMessage } = require('../db/redis');
const { changeRoomHandler, joinRoomHandler, disconnectHandler } = require('./recordRoomAndUser');
const { messageHandler } = require('./messageHandler');
const { getRoomCanvas, drawCanvas, eraseCanvas, clearCanvas } = require('./canvasHandler');
const { editUserAvatar, editUserName, editUserLanguage } = require('./userSetting');
const { createRoom, updateRoomMember, leaveRoom } = require('./roomHandler');
const { roomPlayingVideoOverHandler, roomIsPlayingHandler } = require('./video');
const { listUsersOfRoom, searchUsersUnderNamespaceAndNotRoom, searchAllUsersExclusiveSelfInNamespace } = require('./usersHandler');
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
// 用來記錄當前 socket 進到的 roomId，作為斷線時移除使用
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
  const io = socket_io(server, {
    pingTimeout: 60000
  });
  // 註冊 socket io for eachNamespace
  io.of(/^\/namespaceId=\d+$/).on('connect', function (socket) {
    // 用來記錄當前 socket 進到的 roomId，作為斷線時移除使用
    // let currentSelectedRoomId = 0;
    // 有人連線進來
    const subNamespace = socket.nsp;
    // 包一個共用物件
    const socketHandlerObj = {
      socket: socket,
      roomUsersPair: roomUsersPair,
      roomPeerIdList: roomPeerIdList,
      subNamespace: subNamespace,
      currentSelectedRoomId: 0
    }
    // 更換房間的邏輯
    changeRoomHandler(socketHandlerObj);
    // 加入房間的邏輯
    joinRoomHandler(socketHandlerObj);
    // 發送訊息邏輯處理
    messageHandler(socketHandlerObj);

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
    listUsersOfRoom(socketHandlerObj);

    searchAllUsersExclusiveSelfInNamespace(socketHandlerObj);

    // canvas 歷史畫面
    getRoomCanvas(socketHandlerObj);
    // 畫 canvas
    drawCanvas(socketHandlerObj);
    // 擦 canvas
    eraseCanvas(socketHandlerObj);
    // 刪除 canvas
    clearCanvas(socketHandlerObj);

    // 這邊先不拆有 defect
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
    roomIsPlayingHandler(socketHandlerObj);

    disconnectHandler(socketHandlerObj);

    // 取得現在在 namespaceId 底下但不在該房間下的用戶
    searchUsersUnderNamespaceAndNotRoom(socketHandlerObj);

    // 新增房間
    createRoom(socketHandlerObj);
    // 更新房間用戶
    updateRoomMember(socketHandlerObj);
    // 更新使用者大頭貼
    editUserAvatar(socketHandlerObj);
    // 更新使用者姓名
    editUserName(socketHandlerObj);
    // 更新使用者偏好語言
    editUserLanguage(socketHandlerObj);
    // 視訊結束
    roomPlayingVideoOverHandler(socketHandlerObj);
    // 用戶退群
    leaveRoom(socketHandlerObj);
  })
};

module.exports = socketio;