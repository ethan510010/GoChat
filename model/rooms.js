const { exec, createRoomTransaction } = require('../db/mysql');

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

const getRooms = async (userId) => {
  const allRoomsResultList = await exec(`
    select user_room_junction.roomId as id, room.name as name
    from user_room_junction 
    inner join room 
    on user_room_junction.roomId=room.id where userId=${userId}
  `);
  return allRoomsResultList;
}

module.exports = {
  insertNewRoom,
  getRooms
}