const { updateUserSelectedRoom } = require('../model/users');

// 加入房間
const joinRoomHandler = (socketHandlerObj, roomUsersPair, roomPeerIdList, currentSelectedRoomId) => {
  const { socket, subNamespace } = socketHandlerObj;
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
}

// 切換房間
const changeRoomHandler = (socketHandlerObj,  roomUsersPair, roomPeerIdList, currentSelectedRoomId) => {
  const { socket, subNamespace } = socketHandlerObj;
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
}

const disconnectHandler = (socketHandlerObj, roomUsersPair, roomPeerIdList, currentSelectedRoomId) => {
  const { socket } = socketHandlerObj;
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
}

module.exports = {
  changeRoomHandler,
  joinRoomHandler,
  disconnectHandler
}