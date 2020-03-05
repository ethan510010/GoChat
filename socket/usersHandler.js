const { getUsersOfRoom, getUsersOfRoomExclusiveSelf, getAllUsersOfNamespaceExclusiveSelf } = require('../model/users');

const listUsersOfRoom = (socketHandlerObj, roomUsersPair) => {
  const { socket } = socketHandlerObj;
  socket.on('getUsersOfRoom', async (validRoomId) => {
    try {
      // 拿到切換到的房間全部的用戶
      const usersOfRoom = await getUsersOfRoom(validRoomId);
      socket.emit('showUsersOfRoom', {
        usersOfRoom,
        roomUsersPair: socketHandlerObj.roomUsersPair
      });
    } catch (error) {
      socket.emit('customError', error);
    }
  })
}

const searchUsersUnderNamespaceAndNotRoom = (socketHandlerObj) => {
  const { socket } = socketHandlerObj;
  socket.on('searchUsersUnderNamespaceAndNotRoom', async (dataFromClient, callback) => {
    const { roomId, selfUserId } = dataFromClient;
    try {
      const usersOfRoom = await getUsersOfRoomExclusiveSelf(roomId, selfUserId);
      callback({
        usersOfRoom
      })
    } catch (error) {
      socket.emit('customError', error);
    }
  })
}

const searchAllUsersExclusiveSelfInNamespace = (socketHandlerObj) => {
  const { socket } = socketHandlerObj;
  socket.on('searchAllUsersExclusiveSelfInNamespace', async (namespaceInfo, callback) => {
    const { currentNamespaceId, userId } = namespaceInfo;
    try {
      const validAllUsers = await getAllUsersOfNamespaceExclusiveSelf(currentNamespaceId, userId);
      callback({
        validAllUsers
      })  
    } catch (error) {
      socket.emit('customError', error);
    } 
  })
}

module.exports = {
  listUsersOfRoom,
  searchUsersUnderNamespaceAndNotRoom,
  searchAllUsersExclusiveSelfInNamespace
}