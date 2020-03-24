const { activateGeneralUser } = require('../model/users');

const activateUser = async (req, res) => {
  const urlPath = req.path;
  const { activeToken } = req.query;
  switch (urlPath) {
    case '/signup':
      if (activeToken) {
        try {
          const {
            userId, userEmail, userName, accessToken, selectedLanguage,
          } = await activateGeneralUser(activeToken);
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
            default:
              break;
          }
          res.render('sign', {
            presentSigninUI: undefined,
            title: 'Chatvas',
            directlyLogin: true,
            userId,
            email: userEmail,
            name: userName,
            accessToken,
            uiLangauge,
          });
        } catch (error) {
          res.status(500).send('Server error');
        }
      } else {
        res.render('sign', {
          presentSigninUI: undefined,
          title: 'Chatvas',
          directlyLogin: false,
          userId: undefined,
          email: undefined,
          name: undefined,
          accessToken: undefined,
          uiLangauge: undefined,
        });
      }
      break;
    case '/signin':
      res.render('sign', {
        presentSigninUI: true,
        title: 'Chatvas',
        directlyLogin: false,
        userId: undefined,
        email: undefined,
        name: undefined,
        accessToken: undefined,
        uiLangauge: undefined,
      });
      break;
    default:
      break;
  }
};

module.exports = {
  activateUser,
};
