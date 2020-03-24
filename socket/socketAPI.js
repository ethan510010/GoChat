const socketIO = require('socket.io');
const { changeRoomHandler, joinRoomHandler, disconnectHandler } = require('./recordRoomAndUser');
const { messageHandler } = require('./messageHandler');
const {
  getRoomCanvas, drawCanvas, eraseCanvas, clearCanvas, saveEachTimeDrawResult,
} = require('./canvasHandler');
const { editUserAvatar, editUserName, editUserLanguage } = require('./userSetting');
const { createRoom, updateRoomMember, leaveRoom } = require('./roomHandler');
const { roomPlayingVideoOverHandler, roomIsPlayingHandler } = require('./video');
const { listUsersOfRoom, searchUsersUnderNamespaceAndNotRoom, searchAllUsersExclusiveSelfInNamespace } = require('./usersHandler');
const { getHistory } = require('./historyHandler');

const roomUsersPair = {};
const socketio = {};
// 用來記錄當前 socket 進到的 roomId，作為斷線時移除使用
// 用來記錄當前 room 跟 peerId 的 list
const roomPeerIdList = {};

socketio.getSocketio = async (server) => {
  const io = socketIO(server, {
    pingTimeout: 60000,
  });
  // 註冊 socket io for eachNamespace
  io.of(/^\/namespaceId=\d+$/).on('connect', (socket) => {
    // 用來記錄當前 socket 進到的 roomId，作為斷線時移除使用
    // let currentSelectedRoomId = 0;
    // 有人連線進來
    // 包一個共用物件
    const socketHandlerObj = {
      socket,
      subNamespace: socket.nsp,
      currentSelectedRoomId: 0,
      roomPeerIdList,
      roomUsersPair,
    };
    // 加入房間的邏輯
    joinRoomHandler(socketHandlerObj);
    // 更換房間的邏輯
    changeRoomHandler(socketHandlerObj);
    // 發送訊息邏輯處理
    messageHandler(socketHandlerObj);
    // 房間歷史訊息
    getHistory(socketHandlerObj);
    // 獲取房間的用戶
    listUsersOfRoom(socketHandlerObj);
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
    // 斷線處理
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
  });
};

module.exports = socketio;
