const { insertNewRoom, updateRoom, userLeaveRoom } = require('../model/rooms');
const createRoom = (socketHandlerObj) => {
  const { socket, subNamespace } = socketHandlerObj;
  socket.on('createRoom', async (newRoomInfo) => {
    try {
      const { channelName, namespaceId, userIdList } = newRoomInfo;
      const { channelId, bindingNamespaceId } = await insertNewRoom(channelName, namespaceId, userIdList);
      // 廣播給全部人，可以即時看到被加進去的房間
      subNamespace.emit('newRoomCreated', {
        newRoom: {
          roomId: channelId,
          roomName: channelName
        },
        bindingNamespaceId,
        userIdList
      })
    } catch (error) {
      socket.emit('customError', error);
    }
  })
}

const updateRoomMember = (socketHandlerObj) => {
  const { socket, subNamespace } = socketHandlerObj;
  socket.on('updateRoomMember', async (updateInfo, callback) => {
    const { inviterUserId, room, userList, newAddedMemberIdList } = updateInfo;
    try {
      const { shouldInsertUserIdList } = await updateRoom(room.roomId, newAddedMemberIdList);
      // userList 是返回給邀請發起人的
      // 取交集是真的要返回給被邀請人的
      const validUserList = userList.filter((user) => {
        return (shouldInsertUserIdList.indexOf(user.userId) > -1);
      })
      subNamespace.emit('receiveUpdateNewMember', {
        inviterUserId,
        room,
        userList,
        validUserList
      })
      callback({
        updateFinished: true
      })
    } catch (error) {
      socket.emit('customError', error);
    }
  })
}

const leaveRoom = (socketHandlerObj) => {
  const { socket, subNamespace } = socketHandlerObj;
  socket.on('leaveRoom', async (dataFromClient) => {
    const leaveRoomId = dataFromClient.leaveRoom.roomId;
    const leaveUserId = dataFromClient.leaveUser.userId;
    try {
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
    } catch (error) {
      socket.emit('customError', error);
    }
  })
}

module.exports = {
  createRoom,
  updateRoomMember,
  leaveRoom
}