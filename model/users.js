const { createGeneralUser } = require('../db/users')

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
      expired_date=${expiredDate}`
    ;
    const insertUserDetailSQL = `
      INSERT INTO general_user_info SET
      avatarUrl='${avatarUrl}',
      email='${email}',
      password='${password}',
      name='${name}',
      userId=?`
    ; 
    const insertUserResult = await createGeneralUser(insertUserBasicSQL, insertUserDetailSQL);
    return insertUserResult;
}


module.exports = {
  insertUser
}