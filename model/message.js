const { exec, execWithParaObj } = require('../db/mysql');

const listSpecifiedRoomMessages = async (roomId) => {
  // const messages = await exec(`
  //   select * from message 
  //   inner join
  //   (select tempTable.userId, tempTable.provider, IFNULL(tempTable.name, fb_info.fb_name) as name, IFNULL(tempTable.email, fb_info.fb_email) as email, IFNULL(tempTable.avatarUrl, fb_info.fb_avatar_url) as avatarUrl from (select user.id as userId, provider, name, avatarUrl, email from user 
  //   left join general_user_info 
  //   on user.id=general_user_info.userId) as tempTable
  //   left join fb_info
  //   on tempTable.userId=fb_info.userId) as wholeUserTable
  //   on message.userId=wholeUserTable.userId
  //   where roomId=${roomId} 
  //   order by createdTime desc
  // `);
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
    where roomId=${roomId}
    order by createdTime desc
  `);
  return messages;
}

const saveTranslatedContent = async(translateObj) => {
  const insertResult = await execWithParaObj(`
    insert into translation_message
    set ? 
  `, translateObj);
  return insertResult;
}

module.exports = {
  listSpecifiedRoomMessages,
  saveTranslatedContent
}