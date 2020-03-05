const {
  exec,
  createConnection,
  startTransaction,
  query,
  commit } = require('../db/mysql');
const AppError = require('../common/customError');

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
    throw new AppError(error.message, 500);
  }
}

const listExistedRooms = async () => {
  try {
    const allRooms = await exec(`
    select name from room
  `);
    allRoomsName = allRooms.map((eachRoom) => {
      return eachRoom.name;
    });
    return allRoomsName;
  } catch (error) {
    throw new AppError(error.message, 500);
  }
}

const getRooms = async (userId) => {
  try {
    const roomsOfUser = await exec(`
    select user_room_junction.roomId as id, room.name as name
    from user_room_junction 
    inner join room 
    on user_room_junction.roomId=room.id where userId=${userId}
  `);
    return roomsOfUser;
  } catch (error) {
    throw new AppError(error.message, 500);
  }
}

const getRoomsOfNamespaceAndUser = async (namespaceId, userId) => {
  try {
    const roomsOfUserAndNamespace = await exec(`
    select user_room_junction.roomId, user_room_junction.userId, room.name, namespace.id as namespaceId, namespace.namespaceName from user_room_junction
    inner join room
    on user_room_junction.roomId=room.id
    inner join namespace
    on room.namespaceId=namespace.id 
    where userId=${userId} and namespaceId=${namespaceId}
  `);
    return roomsOfUserAndNamespace;
  } catch (error) {
    throw new AppError(error.message, 500);
  }
}

const getAllRoomsOfNamespace = async (namespaceId) => {
  try {
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
  } catch (error) {
    throw new AppError(error.message, 500);
  }
}

const updateRoom = async (roomId, userIdList) => {
  const searchRepeatedUserSQL = `select * from user_room_junction where roomId=? and userId in (?) for update`;
  const updateRoomMemberSQL = `
    insert into user_room_junction
    set roomId=?, userId=?
  `;
  try {
    const connection = await createConnection();
    await startTransaction(connection);
    const searchedUsers = await query(connection, searchRepeatedUserSQL, [roomId, userIdList]);
    const searchedUserIdList = searchedUsers.map((user) => {
      return user.userId;
    });
    // userIdList 與撈出來的比對取差集，差集才是真的要進 DB 的 user
    const shouldInsertUserIdList = userIdList.filter((userId) => {
      return (searchedUserIdList.indexOf(userId) === -1);
    })
    for (let i = 0; i < shouldInsertUserIdList.length; i++) {
      const userId = shouldInsertUserIdList[i];
      await query(connection, updateRoomMemberSQL, [roomId, userId]);
    }
    const updateRoomMemberResult = await commit(connection, {
      shouldInsertUserIdList: shouldInsertUserIdList,
      roomId: roomId,
      userIdList: userIdList
    });
    return updateRoomMemberResult;
  } catch (error) {
    throw new AppError(error.message, 500);
  }
}

const userLeaveRoom = async (roomId, userId) => {
  const leaveRoomSQL = `
    DELETE FROM user_room_junction 
    WHERE userId='${userId}' and roomId='${roomId}' 
  `;
  try {
    const deleteResult = await exec(leaveRoomSQL);
    if (deleteResult) {
      return true;
    } else {
      return false;
    }  
  } catch (error) {
    throw new AppError(error.message, 500);
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