const { exec } = require('../db/mysql');
const AppError = require('../common/customError');

const getUserProfileByUserId = async (userId) => {
  try {
    const userProfileResult = await exec(`
    select 
    tempTable.userId, 
    tempTable.provider, 
    tempTable.selected_language as selectedLanguage,
    IFNULL(tempTable.name, fb_info.fb_name) as name, 
    IFNULL(tempTable.email, fb_info.fb_email) as email, 
    IFNULL(tempTable.avatarUrl, fb_info.fb_avatar_url) as avatarUrl from (select user.id as userId, provider, name, avatarUrl, email, selected_language from user 
    left join general_user_info 
    on user.id=general_user_info.userId) as tempTable
    left join fb_info
    on tempTable.userId=fb_info.userId
    where tempTable.userId=${userId}
  `);
    if (userProfileResult.length > 0) {
      return userProfileResult[0];
    }
    return null;
  } catch (error) {
    throw new AppError(error.message, 500);
  }
};

module.exports = {
  getUserProfileByUserId,
};
