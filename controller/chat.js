const { getUserInfoByUserId } = require('../model/chat');
const { getRooms, listExistedRooms } = require('../model/rooms');
const { getAllUsers } = require('../model/users');

const chatPageContent = async (req, res) => {
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
    // render 出全部現存的房間
    const allExistedRooms = await listExistedRooms();
    res.render('chat', {
      roomTitle: lastSelectedRoomTitle,
      currentUserDetail: userProfile,
      userAvatar: uiAvatar,
      rooms: roomsOfUser,
      allUsers: allUsers,
      allRooms: allExistedRooms
    })
  } catch (error) {
    res.status(500).send(error.message);
  }
}

module.exports = {
  chatPageContent
}