const { exec } = require('../db/mysql');
const AppError = require('../common/customError');

const getUserInfoByUserId = async (userId) => {
  try {
    const userProfileResult = await exec(`
    select 
    tempTable.userId, 
    tempTable.provider, 
    tempTable.expiredtime,
    tempTable.lastSelectedRoomId,
    room.name as lastSelectedRoomTitle,
    tempTable.selectedLanguage,
    IFNULL(tempTable.name, fb_info.fb_name) as name, 
    IFNULL(tempTable.email, fb_info.fb_email) as email, 
    IFNULL(tempTable.avatarUrl, fb_info.fb_avatar_url) as avatarUrl from (select user.id as userId, provider, name, avatarUrl, email, expired_date as expiredTime, last_selected_room_id as lastSelectedRoomId, selected_language as selectedLanguage from user 
    left join general_user_info 
    on user.id=general_user_info.userId) as tempTable
    left join fb_info
    on tempTable.userId=fb_info.userId
    inner join room
    on tempTable.lastSelectedRoomId=room.id
    where tempTable.userId=${userId}
  `)
  if (userProfileResult.length > 0) {
    return userProfileResult[0];
  } else {
    return null;
  }
  } catch (error) {
    throw new AppError(error.message, 500);
  }
}

module.exports = {
  getUserInfoByUserId
}