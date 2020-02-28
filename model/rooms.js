const { exec, createRoomTransaction, updateRoomMember } = require('../db/mysql');

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
    const createNewRoomResult = await createRoomTransaction(insertRoomSQL, userRoomJuntionSQL, userIdList, roomName);  
    createNewRoomResult.bindingNamespaceId = namespaceId;
    return createNewRoomResult
  } catch (error) {
    console.log(error);
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
  const allRoomsName = roomsOfNamespace.map((eachRoom) => {
    return eachRoom.roomName;
  })
  return allRoomsName;
}

const updateRoom = async (roomId, userIdList) => {
  const updateRoomMemberSQL = `
    insert into user_room_junction
    set roomId=?, userId=?
  `;
  const updateRoomMemberResult = await updateRoomMember(updateRoomMemberSQL, roomId, userIdList);
  return updateRoomMemberResult;
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