const { exec, createRoomTransaction, updateRoomMember } = require('../db/mysql');

const insertNewRoom = async (roomName, userIdList) => {
  const insertRoomSQL = `
    insert into room set name='${roomName}'
  `
  const userRoomJuntionSQL = `
    insert into user_room_junction 
    set roomId=?,
    userId=?
  `
  const createRoomResultList = await createRoomTransaction(insertRoomSQL, userRoomJuntionSQL, userIdList);
  return createRoomResultList;
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
  getRooms,
  updateRoom,
  userLeaveRoom
}