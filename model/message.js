const { exec } = require('../db/mysql');

const listSpecifiedRoomMessages = async (roomId) => {
  const messages = await exec(`
    select * from message 
    inner join
    (select tempTable.userId, tempTable.provider, IFNULL(tempTable.name, fb_info.fb_name) as name, IFNULL(tempTable.email, fb_info.fb_email) as email, IFNULL(tempTable.avatarUrl, fb_info.fb_avatar_url) as avatarUrl from (select user.id as userId, provider, name, avatarUrl, email from user 
    left join general_user_info 
    on user.id=general_user_info.userId) as tempTable
    left join fb_info
    on tempTable.userId=fb_info.userId) as wholeUserTable
    on message.userId=wholeUserTable.userId
    where roomId=${roomId}
  `);
  return messages;
}

module.exports = {
  listSpecifiedRoomMessages
}