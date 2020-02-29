const { getUserInfoByUserId } = require('../model/chat');
const { getRoomsOfNamespaceAndUser, getAllRoomsOfNamespace } = require('../model/rooms');
const {
  getAllUsersOfNamespaceExclusiveSelf,
  getUsersOfRoom } = require('../model/users');

const chatPageContent = async (req, res) => {
  // inputUserId 就是當前用戶 id
  const inputUserId = req.query.userId;
  const inputNamespaceId = req.query.namespaceId;
  try {
    let userProfile = await getUserInfoByUserId(inputUserId);
    const {
      avatarUrl,
      lastSelectedRoomTitle
    } = userProfile;
    // render 出用戶資料
    const uiAvatar = avatarUrl === '' ? '/images/defaultAvatar.png' : avatarUrl;
    userProfile.avatarUrl = uiAvatar;
    // render 出現在有在該 namespace而且此用戶有被加入的房間
    const allRoomsOfCurrentUserAndNamespace = await getRoomsOfNamespaceAndUser(inputNamespaceId, inputUserId);
    // render 出在該 namespace 底下的所有用戶，但不包含自己
    const allUsersOfNamespaceExclusiceSelf = await getAllUsersOfNamespaceExclusiveSelf(inputNamespaceId, inputUserId);
    // render 出全部現存的房間
    const  { namespaceName, allRoomsName }  = await getAllRoomsOfNamespace(inputNamespaceId);
    let userLanguage = '';
    switch (userProfile.selectedLanguage) {
      case 'en':
        userLanguage = 'English';
        break;
      case 'zh-TW':
        userLanguage = '繁體中文';
        break;
      case 'ja':
        userLanguage = 'Japanese';
        break;
      case 'es':
        userLanguage = 'Spanish';
        break;
    }
    // render 出用戶最後選擇的房間的用戶
    const usersOfRoom = await getUsersOfRoom(userProfile.lastSelectedRoomId);
    res.render('chat', {
      roomTitle: lastSelectedRoomTitle,
      currentUserDetail: userProfile,
      userAvatar: uiAvatar,
      rooms: allRoomsOfCurrentUserAndNamespace,
      allUsers: allUsersOfNamespaceExclusiceSelf,
      allRooms: allRoomsName,
      currentNamespaceId: inputNamespaceId,
      currentNamespaceName: namespaceName,
      userLanguage: userLanguage,
      usersOfRoom: usersOfRoom,
      currentNamespaceDefaultRoom: allRoomsOfCurrentUserAndNamespace[0]
    })
  } catch (error) {
    res.status(500).send(error.message);
  }
}

module.exports = {
  chatPageContent
}