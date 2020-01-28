const { getUserProfileByUserId } = require('../model/userLanguage');
const userProfile = async (req, res, next) => {
  const { userId } = req.query;
  try {
    const userProfile = await getUserProfileByUserId(userId);
    if (userProfile) {
      const { name, email, avatarUrl } = userProfile;
      const userAvatar = avatarUrl === '' ? '/images/defaultAvatar.png' : avatarUrl;
      res.render('userLanguage', {
        userName: name,
        userEmail: email,
        userAvatar: userAvatar
      })
    } else {
      res.status(200).send('沒有找到對應的 user');
    }
    
  } catch (error) {
    res.send(error.message);
  }
}

module.exports = {
  userProfile
}