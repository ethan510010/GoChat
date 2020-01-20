const { createGeneralUser, exec, escape } = require('../db/mysql')

const insertUser = async (
  accessToken, 
  fbAccessToken, 
  provider, 
  expiredDate,
  avatarUrl,
  email,
  password,
  name) => {
    const userInfoObj = {
      accessToken,
      fbAccessToken,
      provider,
      expiredDate,
      avatarUrl,
      email,
      password,
      name
    }
    const insertUserBasicSQL = `
      INSERT INTO user SET 
      access_token=?,
      fb_access_token=?,
      provider=?,
      expired_date=?`;

    let insertUserDetailSQL = '';
    if (provider === 'native') {
      insertUserDetailSQL = `
      INSERT INTO general_user_info SET
      avatarUrl=?,
      email=?,
      password=?,
      name=?,
      userId=?`;
    } else if (provider === 'facebook') {
      insertUserDetailSQL = `
      INSERT INTO fb_info SET
      fb_avatar_url=?,
      fb_name=?,
      fb_email=?,
      userId=?`;
    }

    const insertUserResult = await createGeneralUser(insertUserBasicSQL, insertUserDetailSQL, userInfoObj);
    return insertUserResult;
}



const checkExistingUserEmail = async (email) => {
  const searchUserSQL = `
    SELECT general_user_info.email as email FROM user 
    INNER JOIN general_user_info
    ON user.id=general_user_info.userId
    WHERE email='${email}'`; 
  
  const searchResult = await exec(searchUserSQL);
  if (searchResult.length > 0) {
    return true;
  } else {
    return false;
  }
}

const searchUser = async (email, password) => {
  const searchUserSQL = `
    SELECT general_user_info.userId as userId, 
    general_user_info.email as email,
    general_user_info.name as name,
    general_user_info.avatarUrl as avatarUrl,
    general_user_info.password as password FROM
    general_user_info WHERE email='${email}' and password='${password}'
  `
  const searchResult = await exec(searchUserSQL);
  if (searchResult.length > 0) {
    return {
      userId: searchResult[0].userId,
      name: searchResult[0].name,
      avatarUrl: searchResult[0].avatarUrl,
      hasUser: true,
    };
  } else {
    return {
      userId: 0,
      hasUser: false,
    };
  }
}

module.exports = {
  insertUser,
  searchUser,
  checkExistingUserEmail
}