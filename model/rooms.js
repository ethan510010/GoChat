const { exec, createConnection,
  startTransaction,
  query,
  commit } = require('../db/mysql');

const insertNewRoom = async (roomName, namespaceId, userIdList) => {
  const insertRoomSQL = `
    insert into room set name=?, namespaceId=${namespaceId}
  `
  const userRoomJuntionSQL = `
    insert into user_room_junction 
    set roomId=?,
    userId=?
  `
  try {
    const connection = await createConnection();  
    await startTransaction(connection);
    const insertRoomResult = await query(connection, insertRoomSQL, [roomName]);
    const roomId = insertRoomResult.insertId;
    for (let i = 0; i < userIdList.length; i++) {
      const eachUserId = userIdList[i];
      await query(connection, userRoomJuntionSQL, [roomId, eachUserId]);
    }
    const createNewRoomResult = await commit(connection, {
      channelId: roomId,
      allUsers: userIdList
    });
    return createNewRoomResult;
  } catch (error) {
    console.log(error)
  }
}

const listExistedRooms = async () => {
  const allRooms = await exec(`
    select name from room
  `);
  allRoomsName = allRooms.map((eachRoom) => {
    return eachRoom.name;
  });
  return allRoomsName;
}

const getRooms = async (userId) => {
  const roomsOfUser = await exec(`
    select user_room_junction.roomId as id, room.name as name
    from user_room_junction 
    inner join room 
    on user_room_junction.roomId=room.id where userId=${userId}
  `);
  return roomsOfUser;
}

const getRoomsOfNamespaceAndUser = async (namespaceId, userId) => {
  const roomsOfUserAndNamespace = await exec(`
    select user_room_junction.roomId, user_room_junction.userId, room.name, namespace.id as namespaceId, namespace.namespaceName from user_room_junction
    inner join room
    on user_room_junction.roomId=room.id
    inner join namespace
    on room.namespaceId=namespace.id 
    where userId=${userId} and namespaceId=${namespaceId}
  `);
  return roomsOfUserAndNamespace;
}

const getAllRoomsOfNamespace = async (namespaceId) => {
  const roomsOfNamespace = await exec(`
    select room.id as roomId, room.name as roomName, namespace.id as namespaceId, namespace.namespaceName from room
    inner join namespace
    on room.namespaceId=namespace.id
    where namespaceId=${namespaceId}
  `);
  const namespaceName = roomsOfNamespace[0].namespaceName;
  const allRoomsName = roomsOfNamespace.map((eachRoom) => {
    return eachRoom.roomName;
  })
  return {
    namespaceName,
    allRoomsName
  };
}

const updateRoom = async (roomId, userIdList) => {
  const updateRoomMemberSQL = `
    insert into user_room_junction
    set roomId=?, userId=?
  `;
  try {
    const connection = await createConnection();  
    await startTransaction(connection);
    for (let i = 0; i < userIdList.length; i++) {
      const userId = userIdList[i];
      await query(connection, updateRoomMemberSQL, [roomId, userId]);  
    }
    const updateRoomMemberResult = await commit(connection, {
      roomId: roomId,
      userIdList: userIdList
    });
    return updateRoomMemberResult;
  } catch (error) {
    console.log(error);
  }
}

const userLeaveRoom = async (roomId, userId) => {
  const leaveRoomSQL = `
    DELETE FROM user_room_junction 
    WHERE userId='${userId}' and roomId='${roomId}' 
  `;
  const deleteResult = await exec(leaveRoomSQL);
  if (deleteResult) {
    return true;
  } else {
    return false;
  }
}

module.exports = {
  insertNewRoom,
  listExistedRooms,
  getRoomsOfNamespaceAndUser,
  getAllRoomsOfNamespace,
  getRooms,
  updateRoom,
  userLeaveRoom
}