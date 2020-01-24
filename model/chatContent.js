const { createMessageRecord } = require('../db/mysql');

const insertChatMessage = async (messageObj) => {
  const insertMessageResult = await createMessageRecord(`
    insert into message 
    set createdTime=?, 
    messageContent=?, 
    userId=?, 
    roomId=?`
  , messageObj);
  return insertMessageResult;
}

module.exports = {
  insertChatMessage
}