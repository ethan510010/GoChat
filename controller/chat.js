const { getUserInfoByUserId } = require('../model/chat');
const { getRooms, listExistedRooms } = require('../model/rooms');
const { getAllUsers } = require('../model/users');

const chatPageContent = async (req, res) => {
  // inputUserId 就是當前用戶 id
  const inputUserId = req.query.userId;
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
    const roomsOfUser = await getRooms(userId);
    // render 出全部的用戶
    const allUsers = await getAllUsers();
    // 但這邊把自己過濾掉
    let exclusiveSelfUsers = [];
    for (let i = 0; i < allUsers.length; i++) {
      const eachUser = allUsers[i];
      if (eachUser.userId !== parseInt(inputUserId, 10)) {
        exclusiveSelfUsers.push(eachUser);
      }
    }
    // render 出全部現存的房間
    const allExistedRooms = await listExistedRooms();
    res.render('chat', {
      roomTitle: lastSelectedRoomTitle,
      currentUserDetail: userProfile,
      userAvatar: uiAvatar,
      rooms: roomsOfUser,
      allUsers: exclusiveSelfUsers,
      allRooms: allExistedRooms
    })
  } catch (error) {
    res.status(500).send(error.message);
  }
}

module.exports = {
  chatPageContent
}