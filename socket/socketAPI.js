const socket_io = require('socket.io');
const { updateUserSelectedRoom } = require('../model/users');
const { saveCacheMessage } = require('../db/redis');
const { changeRoomHandler, joinRoomHandler, disconnectHandler } = require('./recordRoomAndUser');
const { messageHandler } = require('./messageHandler');
const { getRoomCanvas, drawCanvas, eraseCanvas, clearCanvas, saveEachTimeDrawResult } = require('./canvasHandler');
const { editUserAvatar, editUserName, editUserLanguage } = require('./userSetting');
const { createRoom, updateRoomMember, leaveRoom } = require('./roomHandler');
const { roomPlayingVideoOverHandler, roomIsPlayingHandler } = require('./video');
const { listUsersOfRoom, searchUsersUnderNamespaceAndNotRoom, searchAllUsersExclusiveSelfInNamespace } = require('./usersHandler');
const { getHistory } = require('./historyHandler');

let roomUsersPair = {};
let socketio = {};
// 用來記錄當前 socket 進到的 roomId，作為斷線時移除使用
// 用來記錄當前 room 跟 peerId 的 list
let roomPeerIdList = {};

socketio.getSocketio = async function (server) {
  const io = socket_io(server, {
    pingTimeout: 60000
  });
  // 註冊 socket io for eachNamespace
  io.of(/^\/namespaceId=\d+$/).on('connect', function (socket) {
    // 用來記錄當前 socket 進到的 roomId，作為斷線時移除使用
    let currentSelectedRoomId = 0;
    // 有人連線進來
    const subNamespace = socket.nsp;
    // 包一個共用物件
    const socketHandlerObj = {
      socket: socket,
      subNamespace: subNamespace
    }
    
    // 加入房間的邏輯
    // joinRoomHandler(socketHandlerObj, roomUsersPair, roomPeerIdList, currentSelectedRoomId);
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
    // 更換房間的邏輯
    // changeRoomHandler(socketHandlerObj, roomUsersPair, roomPeerIdList, currentSelectedRoomId);
    socket.on('changeRoom', async (roomDetailInfo, callback) => {
      const { roomId } = roomDetailInfo.joinRoomInfo;
      const { userInfo, peerId } = roomDetailInfo;
      // 更新使用者最後選到的房間
      const updateRoomResult = await updateUserSelectedRoom(userInfo.userId, roomId);
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
        userInfo.socketId = socket.id;
        // 房間加入切換到的人
        roomUsersPair[roomId].push(userInfo);
        roomPeerIdList[roomId].push({
          peerId: peerId,
          user: userInfo
        })
        socket.join(roomId);
        // 2. 離開舊房間的處理
        const leaveRoomId = roomDetailInfo.lastChooseRoom.roomId;
        if (roomUsersPair[leaveRoomId]) {
          // 移除
          const removeIndex = roomUsersPair[leaveRoomId].findIndex(user => {
            return user.userId === userInfo.userId
          })
          if (removeIndex !== -1) {
            roomUsersPair[leaveRoomId].splice(removeIndex, 1);
            console.log('剛剛移除後房間剩下的', roomUsersPair)
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
    // 發送訊息邏輯處理
    messageHandler(socketHandlerObj);
    // 房間歷史訊息
    getHistory(socketHandlerObj);
    // 獲取房間的用戶
    listUsersOfRoom(socketHandlerObj, roomUsersPair);
    // 獲取所有除了自己以外在 namespace 底下的用戶
    searchAllUsersExclusiveSelfInNamespace(socketHandlerObj);
    // canvas 歷史畫面
    getRoomCanvas(socketHandlerObj);
    // 畫 canvas
    drawCanvas(socketHandlerObj);
    // 擦 canvas
    eraseCanvas(socketHandlerObj);
    // 刪除 canvas
    clearCanvas(socketHandlerObj);
    // 儲存 canvas
    saveEachTimeDrawResult(socketHandlerObj);

    // 房間正在播放影片
    roomIsPlayingHandler(socketHandlerObj);

    // disconnectHandler(socketHandlerObj, roomUsersPair, roomPeerIdList, currentSelectedRoomId);
    socket.on('disconnect', () => {
      console.log('離開前的 roomID', currentSelectedRoomId)
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