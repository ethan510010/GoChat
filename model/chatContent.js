const { createMessageRecord } = require('../db/mysql');

const insertChatMessage = async (messageObj, languageListForEachRoom) => {
  const insertMessageResult = await createMessageRecord(`
    insert into message 
    set createdTime=?, 
    messageContent=?, 
    userId=?, 
    roomId=?,
    messageType=?`
  , messageObj);
  return insertMessageResult;
}

module.exports = {
  insertChatMessage
}