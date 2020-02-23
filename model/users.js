const {
  createGeneralUser,
  exec,
  escape,
  updateFBUserInfo,
  updateGeneralUserTransaction,
  updateUserSelectedNamespaceAndRoomTransaction,
  updateUserNameOrAvatarTransaction } = require('../db/mysql')

const insertUser = async (
  accessToken,
  fbAccessToken,
  provider,
  expiredDate,
  avatarUrl,
  email,
  password,
  name,
  beInvitedRoomId,
  activeToken) => {
  const userInfoObj = {
    accessToken,
    fbAccessToken,
    provider,
    expiredDate,
    avatarUrl,
    email,
    password,
    name,
    beInvitedRoomId,
    activeToken
  }
  let insertUserBasicSQL = '';
  if (beInvitedRoomId) {
    insertUserBasicSQL = `
      INSERT INTO user SET 
      access_token=?,
      fb_access_token=?,
      provider=?,
      expired_date=?,
      last_selected_room_id=?`;
  } else {
    insertUserBasicSQL = `
      INSERT INTO user SET 
      access_token=?,
      fb_access_token=?,
      provider=?,
      expired_date=?`;
  }
  let insertUserDetailSQL = '';
  if (provider === 'native') {
      if (activeToken) {
        insertUserDetailSQL = `
        INSERT INTO general_user_info SET
        avatarUrl=?,
        email=?,
        password=?,
        name=?,
        userId=?,
        activeToken=?`;
      } else {
        insertUserDetailSQL = `
        INSERT INTO general_user_info SET
        avatarUrl=?,
        email=?,
        password=?,
        name=?,
        userId=?`;
      }
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

const updateUserFBInfo = async (
  userId,
  accessToken,
  fbAccessToken,
  provider,
  expiredDate,
  avatarUrl,
  fbEmail,
  fbUserName,
  beInvitedRoomId) => {
  const userInfoObj = {
    userId,
    accessToken,
    fbAccessToken,
    provider,
    expiredDate,
    avatarUrl,
    fbEmail,
    fbUserName,
    beInvitedRoomId
  }
  let updateGeneralUserInfoSQL = '';
  if (beInvitedRoomId) {
    updateGeneralUserInfoSQL = `
      update user set
      access_token=?,
      fb_access_token=?,
      provider=?,
      expired_date=?,
      last_selected_room_id=?
      where id=${userId}
    `
  } else {
    updateGeneralUserInfoSQL = `
      update user set
      access_token=?,
      fb_access_token=?,
      provider=?,
      expired_date=?
      where id=${userId}
    `
  }
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
    SELECT user.selected_language as selectedLanguage,
    general_user_info.userId as userId,
    general_user_info.email as email,
    general_user_info.avatarUrl as avatarUrl,
    general_user_info.name as name,
    general_user_info.isActive as isActive
    from user inner join general_user_info on user.id=general_user_info.userId
    WHERE email='${email}' and password='${password}'
  `
  const searchResult = await exec(searchUserSQL);
  if (searchResult.length > 0) {
    const validAvatarUrl = searchResult[0].avatarUrl === '' ? '/images/defaultAvatar.png' : searchResult[0].avatarUrl
    return {
      userId: searchResult[0].userId,
      name: searchResult[0].name,
      avatarUrl: validAvatarUrl,
      selectedLanguage: searchResult[0].selectedLanguage,
      isActive: searchResult[0].isActive,
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
    select 
    user.selected_language as selectedLanguage, 
    fb_info.userId from user inner join fb_info 
    on user.id=fb_info.userId 
    where fb_email='${fbEmail}'
  `)
  if (searchResult.length > 0) {
    return {
      userId: searchResult[0].userId,
      selectedLanguage: searchResult[0].selectedLanguage,
      hasFBUser: true
    };
  } else {
    return {
      userId: null,
      hasFBUser: false
    };
  }
}

const updateUserToken = async (id, token, expiredTime, beInvitedRoomId) => {
  let userObj = {
    userId: id,
    token: token,
    expiredTime: expiredTime,
    beInvitedRoomId: beInvitedRoomId
  }
  const updateResult = await updateGeneralUserTransaction(`UPDATE user SET
  access_token=?,
  expired_date=?
  WHERE id=${id}`,
    `INSERT INTO user_room_junction SET userId=?, roomId=?`, userObj);
  if (updateResult) {
    return true;
  } else {
    return false;
  }
}

const getUserProfileByToken = async (token) => {
  const getProviderSQL = `
    select provider as provider, 
    expired_date as expiredTime,
    selected_language as selectedLanguage,
    last_selected_room_id as lastSelectedRoomId,
    room.name as roomTitle
    from user 
    inner join room
    on user.last_selected_room_id = room.id
    where access_token='${token}' 
  `
  try {
    const userRoughInfo = await exec(getProviderSQL);
    if (userRoughInfo[0]) {
      const { provider, expiredTime, selectedLanguage, lastSelectedRoomId, roomTitle } = userRoughInfo[0];
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
            userProfile.provider = provider;
            userProfile.selectedLanguage = selectedLanguage;
            userProfile.lastSelectedRoomId = lastSelectedRoomId;
            userProfile.lastSelectedRoomTitle = roomTitle;
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
            userProfile.provider = provider;
            userProfile.selectedLanguage = selectedLanguage;
            userProfile.lastSelectedRoomId = lastSelectedRoomId;
            userProfile.lastSelectedRoomTitle = roomTitle;
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

const getAllUsers = async () => {
  const users = await exec(`
    select 
    tempTable.userId, 
    tempTable.provider, 
    IFNULL(tempTable.name, fb_info.fb_name) as name, 
    IFNULL(tempTable.email, fb_info.fb_email) as email, 
    IFNULL(tempTable.avatarUrl, fb_info.fb_avatar_url) as avatarUrl from (select user.id as userId, provider, name, avatarUrl, email from user 
    left join general_user_info 
    on user.id=general_user_info.userId) as tempTable
    left join fb_info
    on tempTable.userId=fb_info.userId
  `)
  return users;
}

const getAllUsersOfNamespaceExclusiveSelf = async (namespaceId, selfUserId) => {
  const namespaceUsers = await exec(`
    select 
    DISTINCT wholeUsersTable.userId, 
    wholeUsersTable.provider, 
    wholeUsersTable.name as userName, 
    wholeUsersTable.email,
    wholeUsersTable.avatarUrl, namespace.id as namespaceId, 
    namespace.namespaceName
    from 
    (select 
      tempTable.userId, 
      tempTable.provider, 
      IFNULL(tempTable.name, fb_info.fb_name) as name, 
      IFNULL(tempTable.email, fb_info.fb_email) as email, 
      IFNULL(tempTable.avatarUrl, fb_info.fb_avatar_url) as avatarUrl from 
      (select user.id as userId, provider, name, avatarUrl, email from user 
      left join general_user_info 
      on user.id=general_user_info.userId) as tempTable
      left join fb_info
      on tempTable.userId=fb_info.userId) as wholeUsersTable
      inner join user_room_junction
      on wholeUsersTable.userId=user_room_junction.userId
      inner join room
      on user_room_junction.roomId=room.id
      inner join namespace
      on namespace.id=room.namespaceId
      where namespaceId=${namespaceId} and wholeUsersTable.userId<>${selfUserId}
  `);
  return namespaceUsers;
}

const updateUserNameOrAvatar = async (userId, newUserName, userAvatar) => {
  // userName 及 userAvatar 一次只會有一個更新
  if (newUserName) {
    const updateResult = await updateUserNameOrAvatarTransaction(
      `select provider from user where id = ${userId}`,
      `update fb_info SET fb_name=? where userId=${userId}`,
      `update general_user_info SET name=? where userId=${userId}`,
      newUserName
    );
    return updateResult;
  }

  if (userAvatar) {
    const updateResult = await updateUserNameOrAvatarTransaction(
      `select provider from user where id = ${userId}`,
      `update fb_info SET fb_avatar_url=? where userId=${userId}`,
      `update general_user_info SET avatarUrl=? where userId=${userId}`,
      userAvatar
    );
    return updateResult;
  }
}

const updateUserSelectedRoom = async (userId, roomId) => {
  const updateResult = await exec(`
    update user set last_selected_room_id=${roomId}
    where id=${userId}
  `);
  if (updateResult) {
    return true;
  } else {
    return false;
  }
}

const updateUserLastNamespace = async (userId, namespaceId) => {
  const userLatestSelectedNamespaceId = await exec(`
    select 
    last_selected_namespace_id as lastSelectedNamespaceId 
    from user 
    where id=${userId}
  `);
  // 如果新選擇的與當前的 namespaceId 不一致，就更新 user 選擇的 namespace 及 
  // user 最後選擇的 roomId 綁定到新的 namespace 底下的 general room
  if (userLatestSelectedNamespaceId[0] && userLatestSelectedNamespaceId[0].lastSelectedNamespaceId !== parseInt(namespaceId, 10)) {
    const updateResult = await updateUserSelectedNamespaceAndRoomTransaction(userId, namespaceId);
    if (updateResult) {
      return {
        namespaceId
      }
    }
  } else {
    return {
      namespaceId
    };
  }
}

const getUsersOfRoom = async (roomId) => {
  const queryResult = await exec(`select 
    wholeUsersTable.userId,
    wholeUsersTable.name,
    wholeUsersTable.email,
    wholeUsersTable.avatarUrl,
    room.id as roomId,
    room.name as roomName
    from 
    (select 
      tempTable.userId, 
      tempTable.provider, 
      IFNULL(tempTable.name, fb_info.fb_name) as name, 
      IFNULL(tempTable.email, fb_info.fb_email) as email, 
      IFNULL(tempTable.avatarUrl, fb_info.fb_avatar_url) as avatarUrl from 
      (select user.id as userId, provider, name, avatarUrl, email from user 
      left join general_user_info 
      on user.id=general_user_info.userId) as tempTable
      left join fb_info
      on tempTable.userId=fb_info.userId) as wholeUsersTable
      inner join user_room_junction
      on wholeUsersTable.userId=user_room_junction.userId
      inner join room
      on user_room_junction.roomId=room.id
      where roomId=${roomId}`
  );
  return queryResult;
}

const getUsersOfRoomExclusiveSelf = async (roomId, selfUserId) => {
  const queryResult = await exec(`
  select 
  wholeUsersTable.userId,
  wholeUsersTable.name,
  wholeUsersTable.email,
  wholeUsersTable.avatarUrl,
  room.id as roomId,
  room.name as roomName
  from 
  (select 
    tempTable.userId, 
    tempTable.provider, 
    IFNULL(tempTable.name, fb_info.fb_name) as name, 
    IFNULL(tempTable.email, fb_info.fb_email) as email, 
    IFNULL(tempTable.avatarUrl, fb_info.fb_avatar_url) as avatarUrl from 
    (select user.id as userId, provider, name, avatarUrl, email from user 
    left join general_user_info 
    on user.id=general_user_info.userId) as tempTable
    left join fb_info
    on tempTable.userId=fb_info.userId) as wholeUsersTable
    inner join user_room_junction
    on wholeUsersTable.userId=user_room_junction.userId
    inner join room
    on user_room_junction.roomId=room.id
    where roomId=${roomId} and wholeUsersTable.userId<>${selfUserId}`
  );
  return queryResult;
}

const searchUserTokenExpiredTime = async (token, userId) => {
  const searchedUsers = await exec(`
    select expired_date as expiredDate from user where id=${userId} and access_token='${token}'
  `);
  if (searchedUsers[0]) {
    return searchedUsers[0];
  } else {
    return [];
  }
}

const activateGeneralUser = async (activeToken) => {
  const result = await exec(`
    UPDATE general_user_info SET isActive=1 
    where activeToken='${activeToken}'`);
  return result;
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
  getAllUsers,
  updateUserSelectedRoom,
  getAllUsersOfNamespaceExclusiveSelf,
  updateUserLastNamespace,
  getUsersOfRoom,
  getUsersOfRoomExclusiveSelf,
  updateUserNameOrAvatar,
  searchUserTokenExpiredTime,
  activateGeneralUser
}