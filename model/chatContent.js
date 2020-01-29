const { createMessageRecord } = require('../db/mysql');

const insertChatMessage = async (messageObj, languageListForEachRoom) => {
  let languageStr = '';
  for (let i = 0; i < languageListForEachRoom.length; i++) {
    const eachLanguage = languageListForEachRoom[i];
    languageStr += `${eachLanguage},`;
  }
  const messageLanguages = languageStr.slice(0, -1);
  const insertMessageResult = await createMessageRecord(`
    insert into message 
    set createdTime=?, 
    messageContent=?, 
    userId=?, 
    roomId=?,
    languageVersion='${messageLanguages}'`
  , messageObj);
  return insertMessageResult;
}

module.exports = {
  insertChatMessage
}