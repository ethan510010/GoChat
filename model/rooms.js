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
  const createRoomResultList =  await createRoomTransaction(insertRoomSQL, userRoomJuntionSQL, userIdList);
  return createRoomResultList;
}

module.exports = {
  insertNewRoom
}