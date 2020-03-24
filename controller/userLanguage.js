const { getUserProfileByUserId } = require('../model/userLanguage');

const userProfile = async (req, res) => {
  const { userId } = req.query;
  try {
    const queryUserProfile = await getUserProfileByUserId(userId);
    if (queryUserProfile) {
      const {
        name, email, avatarUrl, selectedLanguage,
      } = queryUserProfile;
      const userAvatar = avatarUrl === '' ? '/images/defaultAvatar.png' : avatarUrl;
      let userLanguage = '';
      switch (selectedLanguage) {
        case 'en':
          userLanguage = 'English';
          break;
        case 'zh-TW':
          userLanguage = 'Traditional Chinese';
          break;
        case 'ja':
          userLanguage = 'Japanese';
          break;
        case 'es':
          userLanguage = 'Spanish';
          break;
        default:
          break;
      }
      res.render('userLanguage', {
        userName: name,
        userEmail: email,
        userAvatar,
        userLanguage,
      });
    } else {
      res.status(200).send('沒有找到對應的 user');
    }
  } catch (error) {
    res.status(500).send('Server error');
  }
};

module.exports = {
  userProfile,
};
