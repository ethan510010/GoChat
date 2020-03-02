const { updateUserNameOrAvatar } = require('../model/users');
const { handleBufferUpload } = require('./common');
const { updateUserLanguage } = require('../model/language');
const editUserAvatar = (socketHandlerObj) => {
  const { socket } = socketHandlerObj;
  // 更新使用者大頭貼
  socket.on('editNewAvatar', async (avatarInfo, callback) => {
    const { userInfo, avatarData, fileName } = avatarInfo;
    const s3Path = await handleBufferUpload(avatarData, `${userInfo.userId}_${Date.now()}_${fileName}`);
    await updateUserNameOrAvatar(userInfo.userId, undefined, s3Path);
    callback({
      newAvatarUrl: s3Path
    })
  })
}

const editUserName = (socketHandlerObj) => {
  const { socket } = socketHandlerObj;
  socket.on('editUserName', async (newUserInfo, callback) => {
    const { userId, newUserName } = newUserInfo;
    await updateUserNameOrAvatar(userId, newUserName, undefined);
    callback({
      newUserName
    })
  })
}

const editUserLanguage = (socketHandlerObj) => {
  const { socket } = socketHandlerObj;
  socket.on('editUserLanguage', async (userLanguageInfo, callback) => {
    const { userId, selectedLanguage } = userLanguageInfo;
    await updateUserLanguage(userId, selectedLanguage);
    callback({
      selectedLanguage
    })
  })
}

module.exports = {
  editUserAvatar,
  editUserName,
  editUserLanguage
}