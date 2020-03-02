const { getUsersOfRoom, getUsersOfRoomExclusiveSelf, getAllUsersOfNamespaceExclusiveSelf } = require('../model/users');

const listUsersOfRoom = (socketHandlerObj, roomUsersPair) => {
  const { socket } = socketHandlerObj;
  socket.on('getUsersOfRoom', async (validRoomId) => {
    // 拿到切換到的房間全部的用戶
    const usersOfRoom = await getUsersOfRoom(validRoomId);
    socket.emit('showUsersOfRoom', {
      usersOfRoom,
      roomUsersPair
    });
  })
}

const searchUsersUnderNamespaceAndNotRoom = (socketHandlerObj) => {
  const { socket } = socketHandlerObj;
  socket.on('searchUsersUnderNamespaceAndNotRoom', async (dataFromClient, callback) => {
    const { roomId, selfUserId } = dataFromClient;
    const usersOfRoom = await getUsersOfRoomExclusiveSelf(roomId, selfUserId);
    callback({
      usersOfRoom
    })
  })
}

const searchAllUsersExclusiveSelfInNamespace = (socketHandlerObj) => {
  const { socket } = socketHandlerObj;
  socket.on('searchAllUsersExclusiveSelfInNamespace', async (namespaceInfo, callback) => {
    const { currentNamespaceId, userId } = namespaceInfo;
    const validAllUsers = await getAllUsersOfNamespaceExclusiveSelf(currentNamespaceId, userId);
    callback({
      validAllUsers
    })
  })
}

module.exports = {
  listUsersOfRoom,
  searchUsersUnderNamespaceAndNotRoom,
  searchAllUsersExclusiveSelfInNamespace
}