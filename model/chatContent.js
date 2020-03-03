const { execWithParaObj } = require('../db/mysql');

const insertChatMessage = async (messageObj, languageListForEachRoom) => {
  const insertMessageResult = await execWithParaObj(`insert into message 
  set createdTime=?, 
  messageContent=?, 
  userId=?, 
  roomId=?,
  messageType=?`, [messageObj.createdTime, messageObj.messageContent, messageObj.userId, messageObj.roomId, messageObj.messageType])
  return insertMessageResult;
}

module.exports = {
  insertChatMessage
}