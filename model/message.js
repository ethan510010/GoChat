const { exec, execWithParaObj } = require('../db/mysql');
const { listEachRoomMessagesCache } = require('../db/redis');
const AppError = require('../common/customError');

const listSpecifiedRoomMessages = async (roomId, userSelectedLanguge, page) => {
  try {
    const messages = await exec(`
    select message.messageContent, 
    message.createdTime, 
    wholeUserTable.userId, 
    message.messageType, 
    message.id, 
    translation_message.language, 
    translation_message.translatedContent, 
    wholeUserTable.provider, 
    wholeUserTable.name, 
    wholeUserTable.email, 
    wholeUserTable.avatarUrl 
    from message 
    inner join translation_message on message.id=translation_message.messageId
    inner join
    (select tempTable.userId, tempTable.provider, IFNULL(tempTable.name, fb_info.fb_name) as name, IFNULL(tempTable.email, fb_info.fb_email) as email, IFNULL(tempTable.avatarUrl, fb_info.fb_avatar_url) as avatarUrl from (select user.id as userId, provider, name, avatarUrl, email from user 
    left join general_user_info 
    on user.id=general_user_info.userId) as tempTable
    left join fb_info
    on tempTable.userId=fb_info.userId) as wholeUserTable
    on message.userId=wholeUserTable.userId
    where roomId=${roomId} and language='${userSelectedLanguge}'
    order by createdTime desc limit 30 offset ${(page) * 30}
  `);
    return messages;
  } catch (error) {
    throw new AppError(error.message, 500);
  }
}

const saveTranslatedContent = async (translateObj) => {
  try {
    const insertResult = await execWithParaObj(`
      insert into translation_message
      set ? 
    `, translateObj);
    return insertResult;
  } catch (error) {
    throw new AppError(error.message, 500);
  }
}

const getMessagesCache = async (roomId, language, page) => {
  try {
    const cacheResults = await listEachRoomMessagesCache(roomId, page);
    if (cacheResults.length > 0) {
      let correspondedResults = [];
      cacheResults.map((eachCacheMessage) => {
        const eachValidMessage = JSON.parse(eachCacheMessage);
        const responseMessage = {
          messageContent: eachValidMessage.messageContent,
          createdTime: eachValidMessage.createdTime,
          userId: eachValidMessage.userId,
          messageType: eachValidMessage.messageType,
          id: eachValidMessage.messageId,
          language: language,
          translatedContent: eachValidMessage[language],
          provider: eachValidMessage.provider,
          name: eachValidMessage.name,
          email: eachValidMessage.email,
          avatarUrl: eachValidMessage.avatarUrl
        }
        correspondedResults.push(responseMessage);
      })
      return correspondedResults;
    } else {
      return [];
    }
  } catch (error) {
    throw new AppError(error.message, 500);
  }
}

module.exports = {
  listSpecifiedRoomMessages,
  saveTranslatedContent,
  getMessagesCache
}