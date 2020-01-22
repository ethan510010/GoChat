const { createGeneralUser, exec, escape, updateFBUserInfo } = require('../db/mysql')

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

const updateUserFBInfo = async (userId, accessToken, fbAccessToken, provider, expiredDate, avatarUrl, fbEmail, fbUserName) => {
  const userInfoObj = {
    userId,
    accessToken,
    fbAccessToken,
    provider,
    expiredDate,
    avatarUrl,
    fbEmail,
    fbUserName
  }
  const updateGeneralUserInfoSQL = `
    update user set
    access_token=?,
    fb_access_token=?,
    provider=?,
    expired_date=?
    where id=${userId}
  `
  const updateFBUserDetailsSQL = `
    update fb_info set
    fb_avatar_url=?,
    fb_name=?,
    fb_email=?
    where userId=${userId}
  `
  const updateFBResult = await updateFBUserInfo(updateGeneralUserInfoSQL, updateFBUserDetailsSQL, userInfoObj);
  return updateFBResult;
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

const searchFBUser = async (fbEmail) => {
  const searchResult = await exec(`
    select userId from fb_info where fb_email='${fbEmail}'
  `)
  if (searchResult.length > 0) {
    return {
      userId: searchResult[0].userId,
      hasFBUser: true
    };
  } else {
    return {
      userId: null,
      hasFBUser: false
    };
  }
}

const updateUserToken = async (id, token, expiredTime) => {
  const updateSQL = `
    UPDATE user SET
    access_token='${token}',
    expired_date=${expiredTime}
    WHERE id=${id}
  `
  const updateResult = await exec(updateSQL);
  if (updateResult) {
    return true;
  } else {
    return false;
  }
}

const getUserProfileByToken = async (token) => {
  const getProviderSQL = `
    select provider as provider, 
    expired_date as expiredTime 
    from user where access_token='${token}' 
  `
  try {
    const userRoughInfo = await exec(getProviderSQL);
    if (userRoughInfo[0]) {
      const { provider, expiredTime } = userRoughInfo[0];
      let userProfile = {};
      switch (provider) {
        case 'native':
          const userDetail = await exec(`
            select user.id as userId, 
            avatarUrl, 
            email, 
            name from user 
            inner join general_user_info 
            on user.id=general_user_info.userId
            where access_token='${token}' 
        `);
          if (userDetail[0]) {
            userProfile.userId = userDetail[0].userId;
            userProfile.avatarUrl = userDetail[0].avatarUrl;
            userProfile.email = userDetail[0].email;
            userProfile.name = userDetail[0].name;
            userProfile.expiredTime = expiredTime;
          }
          break;
        case 'facebook':
          const fbUserDetail = await exec(`
            select user.id as userId, 
            fb_avatar_url as avatarUrl, 
            fb_email as email, 
            fb_name as name from user 
            inner join fb_info 
            on user.id=fb_info.userId
            where access_token='${token}' 
          `);
          if (fbUserDetail[0]) {
            userProfile.userId = fbUserDetail[0].userId;
            userProfile.avatarUrl = fbUserDetail[0].avatarUrl;
            userProfile.email = fbUserDetail[0].email;
            userProfile.name = fbUserDetail[0].name;
            userProfile.expiredTime = expiredTime;
          } 
          break;
      }
      return userProfile;
    }
  } catch (error) {
    throw error;
  }
}

const getTokenExpiredTime = async (token) => {
  const tokenExpiredTime = await exec(`
    select expired_date as expiredTime
    from user where access_token='${token}'
  `)

  if (tokenExpiredTime[0].expiredTime) {
    return {
      expiredTime: tokenExpiredTime[0].expiredTime
    }
  } else {
    return {
      expiredTime: 0
    }
  }
}

const getAllUsers = async() => {
  // 這邊之後調整減少 query
  let users = [];
  const listNativeUsers = await exec(`
    select user.id as userId, provider, avatarUrl, email, name 
    from user
    inner join general_user_info
    on user.id = general_user_info.userId
  `);
  const listfavebookUsers = await exec(`
    select user.id as userId, provider, fb_info.fb_avatar_url as avatarUrl, fb_info.fb_email as email, fb_info.fb_name as name
    from user
    inner join fb_info
    on user.id = fb_info.userId
  `)
  for (let index = 0; index < listNativeUsers.length; index++) {
    const nativeUser = listNativeUsers[index];
    const { userId, provider, avatarUrl, email, name } = nativeUser;
    const nativeUserInfo = {
      userId: userId,
      provider: provider,
      avatarUrl: avatarUrl,
      email: email,
      name: name
    }
    users.push(nativeUserInfo)
  }  
  for (let index = 0; index < listfavebookUsers.length; index++) {
    const fbUser = listfavebookUsers[index];
    const { userId, provider, avatarUrl, email, name } = fbUser;
    const fbUserInfo = {
      userId: userId,
      provider: provider,
      avatarUrl: avatarUrl,
      email: email,
      name: name
    }
    users.push(fbUserInfo)
  }
  return users;
}

module.exports = {
  insertUser,
  searchUser,
  searchFBUser,
  updateUserFBInfo,
  checkExistingUserEmail,
  getUserProfileByToken,
  getTokenExpiredTime,
  updateUserToken,
  getAllUsers
}