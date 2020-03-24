const { execWithParaObj } = require('../db/mysql');
const AppError = require('../common/customError');

const insertChatMessage = async (messageObj) => {
  try {
    const insertMessageResult = await execWithParaObj(`insert into message 
    set createdTime=?, 
    messageContent=?, 
    userId=?, 
    roomId=?,
    messageType=?`, [messageObj.createdTime, messageObj.messageContent, messageObj.userId, messageObj.roomId, messageObj.messageType]);
    return insertMessageResult;
  } catch (error) {
    throw new AppError(error.message, 500);
  }
};

module.exports = {
  insertChatMessage,
};
