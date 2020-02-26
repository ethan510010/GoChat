const { activateGeneralUser } = require('../model/users');

const activateUser = async (req, res) => {
  const { activeToken } = req.query;
  if (activeToken) {
    try {
      const { userId, userEmail, userName, accessToken, selectedLanguage } = await activateGeneralUser(activeToken);
      // 直接登入
      let uiLangauge = '';
      switch (selectedLanguage) {
        case 'en':
          uiLangauge = 'English';
          break;
        case 'zh-TW':
          uiLangauge = '繁體中文';
          break;
        case 'ja':
          uiLangauge = 'Japanese';
          break;
        case 'es':
          uiLangauge = 'Spanish';
          break;
      }
      res.render('home', { 
        title: 'Home', 
        directlyLogin: true,
        userId: userId,
        email: userEmail,
        name: userName,
        accessToken: accessToken,
        uiLangauge: uiLangauge
      });    
    } catch (error) {
      throw error;
    }
  } else {
    res.render('home', { 
      title: 'Home', 
      directlyLogin: false,
      userId: undefined,
      email: undefined,
      name: undefined,
      accessToken: undefined,
      uiLangauge: undefined
    });
  }
}

module.exports = {
  activateUser
}