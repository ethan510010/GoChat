const { getUserInfoByUserId } = require('../model/chat');
const { getRooms, listExistedRooms, getRoomsOfNamespaceAndUser, getAllRoomsOfNamespace } = require('../model/rooms');
const { getAllUsers, getAllUsersOfNamespace } = require('../model/users');

const chatPageContent = async (req, res) => {
  // inputUserId 就是當前用戶 id
  const inputUserId = req.query.userId;
  const inputNamespaceId = req.query.namespaceId;
  try {
    let userProfile = await getUserInfoByUserId(inputUserId);
    const {
      userId,
      avatarUrl,
      lastSelectedRoomTitle
    } = userProfile;
    // render 出用戶資料
    const uiAvatar = avatarUrl === '' ? '/images/defaultAvatar.png' : avatarUrl;
    userProfile.avatarUrl = uiAvatar;
    // render 出房間
    // const roomsOfUser = await getRooms(userId);
    // 2/17 開始
    // render 出現在有在該 namespace而且此用戶有被加入的房間
    const allRoomsOfCurrentUserAndNamespace = await getRoomsOfNamespaceAndUser(inputNamespaceId, inputUserId);

    // render 出全部的用戶
    // const allUsers = await getAllUsers();
    // 但這邊把自己過濾掉
    // let exclusiveSelfUsers = [];
    // for (let i = 0; i < allUsers.length; i++) {
    //   const eachUser = allUsers[i];
    //   if (eachUser.userId !== parseInt(inputUserId, 10)) {
    //     exclusiveSelfUsers.push(eachUser);
    //   }
    // }
    // 2/17 開始
    // render 出在該 namespace 底下的所有用戶
    let exclusiveSelfUsersOfNamespace = [];
    const allUsersOfNamespace = await getAllUsersOfNamespace(inputNamespaceId);
    for (let i = 0; i < allUsersOfNamespace.length; i++) {
      const eachUser = allUsersOfNamespace[i];
      if (eachUser.userId !== parseInt(inputUserId, 10)) {
        exclusiveSelfUsersOfNamespace.push(eachUser)
      }
    }

    // render 出全部現存的房間
    // const allExistedRooms = await listExistedRooms();
    // 2/17 開始
    const allExistedRoomsOfNamespace = await getAllRoomsOfNamespace(inputNamespaceId);
    res.render('chat', {
      roomTitle: lastSelectedRoomTitle,
      currentUserDetail: userProfile,
      userAvatar: uiAvatar,
      rooms: allRoomsOfCurrentUserAndNamespace,
      allUsers: exclusiveSelfUsersOfNamespace,
      allRooms: allExistedRoomsOfNamespace,
      currentNamespaceId: inputNamespaceId
    })
  } catch (error) {
    res.status(500).send(error.message);
  }
}

module.exports = {
  chatPageContent
}