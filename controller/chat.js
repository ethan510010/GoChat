const { getUserInfoByUserId } = require('../model/chat');
const { getRooms } = require('../model/rooms');

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

    res.render('chat', {
      roomTitle: lastSelectedRoomTitle,
      currentUserDetail: userProfile,
      userAvatar: uiAvatar,
      rooms: roomsOfUser
    })

  } catch (error) {
    res.status(500).send(error.message);
  }
}

module.exports = {
  chatPageContent
}