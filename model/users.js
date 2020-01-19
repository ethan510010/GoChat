const { createGeneralUser, exec } = require('../db/mysql')

const insertUser = async (
  accessToken, 
  fbAccessToken, 
  provider, 
  expiredDate,
  avatarUrl,
  email,
  password,
  name) => {
    const insertUserBasicSQL = `
      INSERT INTO user SET 
      access_token='${accessToken}',
      fb_access_token='${fbAccessToken}',
      provider='${provider}',
      expired_date=${expiredDate}`;

    const insertUserDetailSQL = `
      INSERT INTO general_user_info SET
      avatarUrl='${avatarUrl}',
      email='${email}',
      password='${password}',
      name='${name}',
      userId=?`;
  
    const insertUserResult = await createGeneralUser(insertUserBasicSQL, insertUserDetailSQL);
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
    SELECT general_user_info.email as email,
    general_user_info.password as password FROM
    general_user_info WHERE email='${email}' and password='${password}'
  `
  const searchResult = await exec(searchUserSQL);
  if (searchResult.length > 0) {
    return true;
  } else {
    return false;
  }
}

module.exports = {
  insertUser,
  searchUser,
  checkExistingUserEmail
}