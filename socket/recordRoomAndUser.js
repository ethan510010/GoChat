const { updateUserSelectedRoom } = require('../model/users');

// 加入房間
const joinRoomHandler = (socketHandlerObj) => {
  socketHandlerObj.socket.on('join', (joinInfo, callback) => {
    const { roomId } = joinInfo.roomInfo;
    const { peerId } = joinInfo;
    socketHandlerObj.currentSelectedRoomId = roomId;
    joinInfo.userInfo.socketId = socketHandlerObj.socket.id;
    // 如果該房間都還沒有會員進入
    if (!socketHandlerObj.roomUsersPair[roomId]) {
      socketHandlerObj.roomUsersPair[roomId] = [];
    }
    // 配合 WebRTC
    if (!socketHandlerObj.roomPeerIdList[roomId]) {
      socketHandlerObj.roomPeerIdList[roomId] = [];
    }
    socketHandlerObj.roomUsersPair[roomId].push(joinInfo.userInfo);

    // WebRTC 事件
    socketHandlerObj.roomPeerIdList[roomId].push({
      peerId,
      user: joinInfo.userInfo,
    });

    socketHandlerObj.socket.join(roomId);
    console.log('加入後房間跟用戶的狀況', socketHandlerObj.roomUsersPair);
    console.log('加入後房間的 roomPeerIdList', socketHandlerObj.roomPeerIdList);
    // 全部廣播 (包含誰在線上的功能，利用 roomUsersPair 實現)
    socketHandlerObj.subNamespace.emit('allPeersForRoom', {
      roomId,
      roomUsersPair: socketHandlerObj.roomUsersPair,
      peersRoomPair: socketHandlerObj.roomPeerIdList,
    });
    callback(joinInfo);
  });
};

// 切換房間
const changeRoomHandler = (socketHandlerObj) => {
  socketHandlerObj.socket.on('changeRoom', async (roomDetailInfo, callback) => {
    const { roomId } = roomDetailInfo.joinRoomInfo;
    const { userInfo, peerId } = roomDetailInfo;
    // 更新使用者最後選到的房間
    try {
      const updateRoomResult = await updateUserSelectedRoom(userInfo.userId, roomId);
      if (updateRoomResult) {
        socketHandlerObj.currentSelectedRoomId = roomId;
        // 如果該房間都還沒有會員進入
        if (!socketHandlerObj.roomUsersPair[roomId]) {
          socketHandlerObj.roomUsersPair[roomId] = [];
        }
        // 配合 webRTC 生成
        if (!socketHandlerObj.roomPeerIdList[roomId]) {
          socketHandlerObj.roomPeerIdList[roomId] = [];
        }
        userInfo.socketId = socketHandlerObj.socket.id;
        // 房間加入切換到的人
        socketHandlerObj.roomUsersPair[roomId].push(userInfo);
        socketHandlerObj.roomPeerIdList[roomId].push({
          peerId,
          user: userInfo,
        });
        socketHandlerObj.socket.join(roomId);
        // 2. 離開舊房間的處理
        const leaveRoomId = roomDetailInfo.lastChooseRoom.roomId;
        if (socketHandlerObj.roomUsersPair[leaveRoomId]) {
          // 移除
          const removeIndex = socketHandlerObj.roomUsersPair[leaveRoomId].findIndex((user) => user.userId === userInfo.userId);
          if (removeIndex !== -1) {
            socketHandlerObj.roomUsersPair[leaveRoomId].splice(removeIndex, 1);
            console.log('剛剛移除後房間剩下的', socketHandlerObj.roomUsersPair);
            socketHandlerObj.socket.leave(leaveRoomId);
          }
        }

        // 移除 WebRTC 裡面的配對 peerId
        if (socketHandlerObj.roomPeerIdList[leaveRoomId]) {
          const removeIndex = socketHandlerObj.roomPeerIdList[leaveRoomId].findIndex((eachPeerDetailInfo) => eachPeerDetailInfo.user.userId === roomDetailInfo.userInfo.userId);
          if (removeIndex !== -1) {
            socketHandlerObj.roomPeerIdList[leaveRoomId].splice(removeIndex, 1);
          }
        }
        console.log('離開房間後剩下的 peer', socketHandlerObj.roomPeerIdList);
        // 代表都完成了
        callback({
          acknowledged: true,
        });
        // 全部的人都廣播
        const { roomUsersPair } = socketHandlerObj;
        const { roomPeerIdList } = socketHandlerObj;
        socketHandlerObj.subNamespace.emit('changeRoomPeersList', {
          roomUsersPair,
          roomPeerIdList,
        });
      }
    } catch (error) {
      socket.emit('customError', error);
    }
  });
};

const disconnectHandler = (socketHandlerObj) => {
  // const { socket } = socketHandlerObj;
  socketHandlerObj.socket.on('disconnect', () => {
    console.log('離開前的 roomID', socketHandlerObj.currentSelectedRoomId);
    if (socketHandlerObj.roomUsersPair[socketHandlerObj.currentSelectedRoomId]) {
      console.log('currentSelectedRoomId', socketHandlerObj.currentSelectedRoomId);
      const removeIndex = socketHandlerObj.roomUsersPair[socketHandlerObj.currentSelectedRoomId].findIndex((user) => user.socketId === socketHandlerObj.socket.id);
      if (removeIndex !== -1) {
        socketHandlerObj.roomUsersPair[socketHandlerObj.currentSelectedRoomId].splice(removeIndex, 1);
        // console.log('斷線後房間剩下的', roomUsersPair[currentSelectedRoomId])
        socketHandlerObj.socket.leave(socketHandlerObj.currentSelectedRoomId);
      }
    }
    console.log('有重整後的房間用戶配對', socketHandlerObj.roomUsersPair);
    // 移除 WebRTC 裡面的配對 peerId
    if (socketHandlerObj.roomPeerIdList[socketHandlerObj.currentSelectedRoomId]) {
      console.log('currentSelectedRoomId', socketHandlerObj.currentSelectedRoomId);
      const removeIndex = socketHandlerObj.roomPeerIdList[socketHandlerObj.currentSelectedRoomId].findIndex((eachPeerDetailInfo) => {
        console.log('user', eachPeerDetailInfo.user.socketId, eachPeerDetailInfo.user.name);
        return eachPeerDetailInfo.user.socketId === socketHandlerObj.socket.id;
      });
      if (removeIndex !== -1) {
        socketHandlerObj.roomPeerIdList[socketHandlerObj.currentSelectedRoomId].splice(removeIndex, 1);
      }
    }
    console.log('有重整後的房間peer配對', socketHandlerObj.roomPeerIdList);
    // 因為斷線 (可能是因為網路斷線，或是用戶切換回 namespace 頁必須讓上線顯示消失)
    socketHandlerObj.subNamespace.emit('allPeersForRoom', {
      roomUsersPair: socketHandlerObj.roomUsersPair,
      peersRoomPair: socketHandlerObj.roomPeerIdList,
    });
  });
};

module.exports = {
  changeRoomHandler,
  joinRoomHandler,
  disconnectHandler,
};

// 暫時保留之前的
// socket.on('join', (joinInfo, callback) => {
//   const { roomId } = joinInfo.roomInfo;
//   const peerId = joinInfo.peerId;
//   currentSelectedRoomId = roomId;
//   joinInfo.userInfo.socketId = socket.id;
//   // 如果該房間都還沒有會員進入
//   if (!roomUsersPair[roomId]) {
//     roomUsersPair[roomId] = [];
//   }
//   // 配合 WebRTC
//   if (!roomPeerIdList[roomId]) {
//     roomPeerIdList[roomId] = [];
//   }
//   roomUsersPair[roomId].push(joinInfo.userInfo);

//   // WebRTC 事件
//   roomPeerIdList[roomId].push({
//     peerId: peerId,
//     user: joinInfo.userInfo
//   });

//   socket.join(roomId);
//   console.log('加入後房間跟用戶的狀況', roomUsersPair)
//   console.log('加入後房間的 roomPeerIdList', roomPeerIdList);
//   // 全部廣播 (包含誰在線上的功能，利用 roomUsersPair 實現)
//   subNamespace.emit('allPeersForRoom', {
//     roomId: roomId,
//     roomUsersPair: roomUsersPair,
//     peersRoomPair: roomPeerIdList
//   })
//   callback(joinInfo);
// })

// socket.on('changeRoom', async (roomDetailInfo, callback) => {
//   const { roomId } = roomDetailInfo.joinRoomInfo;
//   const { userInfo, peerId } = roomDetailInfo;
//   // 更新使用者最後選到的房間
//   const updateRoomResult = await updateUserSelectedRoom(userInfo.userId, roomId);
//   if (updateRoomResult) {
//     currentSelectedRoomId = roomId;
//     // 如果該房間都還沒有會員進入
//     if (!roomUsersPair[roomId]) {
//       roomUsersPair[roomId] = [];
//     }
//     // 配合 webRTC 生成
//     if (!roomPeerIdList[roomId]) {
//       roomPeerIdList[roomId] = [];
//     }
//     userInfo.socketId = socket.id;
//     // 房間加入切換到的人
//     roomUsersPair[roomId].push(userInfo);
//     roomPeerIdList[roomId].push({
//       peerId: peerId,
//       user: userInfo
//     })
//     socket.join(roomId);
//     // 2. 離開舊房間的處理
//     const leaveRoomId = roomDetailInfo.lastChooseRoom.roomId;
//     if (roomUsersPair[leaveRoomId]) {
//       // 移除
//       const removeIndex = roomUsersPair[leaveRoomId].findIndex(user => {
//         return user.userId === userInfo.userId
//       })
//       if (removeIndex !== -1) {
//         roomUsersPair[leaveRoomId].splice(removeIndex, 1);
//         console.log('剛剛移除後房間剩下的', roomUsersPair)
//         socket.leave(leaveRoomId);
//       }
//     }

//     // 移除 WebRTC 裡面的配對 peerId
//     if (roomPeerIdList[leaveRoomId]) {
//       const removeIndex = roomPeerIdList[leaveRoomId].findIndex(eachPeerDetailInfo => {
//         return eachPeerDetailInfo.user.userId === roomDetailInfo.userInfo.userId;
//       });
//       if (removeIndex !== -1) {
//         roomPeerIdList[leaveRoomId].splice(removeIndex, 1);
//       }
//     }
//     console.log('離開房間後剩下的 peer', roomPeerIdList);
//     // 代表都完成了
//     callback({
//       acknowledged: true
//     });
//     // 全部的人都廣播
//     subNamespace.emit('changeRoomPeersList', {
//       roomUsersPair,
//       roomPeerIdList
//     })
//   }
// });

// socket.on('disconnect', () => {
//   console.log('離開前的 roomID', currentSelectedRoomId)
//   if (roomUsersPair[currentSelectedRoomId]) {
//     console.log('currentSelectedRoomId', currentSelectedRoomId)
//     const removeIndex = roomUsersPair[currentSelectedRoomId].findIndex(user => {
//       return user.socketId === socket.id;
//     });
//     if (removeIndex !== -1) {
//       roomUsersPair[currentSelectedRoomId].splice(removeIndex, 1);
//       // console.log('斷線後房間剩下的', roomUsersPair[currentSelectedRoomId])
//       socket.leave(currentSelectedRoomId);
//     }
//   }
//   console.log('有重整後的房間用戶配對', roomUsersPair);
//   // 移除 WebRTC 裡面的配對 peerId
//   if (roomPeerIdList[currentSelectedRoomId]) {
//     console.log('currentSelectedRoomId', currentSelectedRoomId);
//     const removeIndex = roomPeerIdList[currentSelectedRoomId].findIndex(eachPeerDetailInfo => {
//       console.log('user', eachPeerDetailInfo.user.socketId, eachPeerDetailInfo.user.name)
//       return eachPeerDetailInfo.user.socketId === socket.id;
//     });
//     if (removeIndex !== -1) {
//       roomPeerIdList[currentSelectedRoomId].splice(removeIndex, 1);
//     }
//   }
//   console.log('有重整後的房間peer配對', roomPeerIdList)
// }
