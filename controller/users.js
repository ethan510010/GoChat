const crypto = require('crypto');
require('dotenv').config();
const { insertUser, searchUser } = require('../model/users');
const { generateAccessToken, hashThirdPartyLoginToken } = require('../common/common');
const rp = require('request-promise'); 

// 登入
const userSignin = async (req, res) => {
  const { email, password, signinway, thirdPartyAuthToken } = req.body;
  switch (signinway) {
    case 'native':
      const { accessToken, tokenExpiredDate, hashedUserPassword } = generateAccessToken(email, password);
      try {
        const { userId, hasUser, name, avatarUrl } = await searchUser(email, hashedUserPassword);
        if (hasUser) {
          res.status(200).json({
            data: {
              accessToken: accessToken,
              expiredDate: tokenExpiredDate,
              user: {
                userId: userId,
                email: email, 
                name: name,
                avatarUrl: avatarUrl
              }
            }
          })
        } else {
          res.status(200).json({
            data: '此用戶不存在'
          })
        }
      } catch (err) {
        res.status(500).send(err.message);
      }
      break;
    case 'facebook':
      // 拿取使用者 fb 資料
      const options = {
        uri: 'https://graph.facebook.com/me',
        qs: {
          fields: 'id,name,email,picture',
          access_token: thirdPartyAuthToken,
        },
        json: true,
      };
      const fbResponse = await rp(options);
      const fbUserName = fbResponse.name;
      const fbPicture = fbResponse.picture.data.url;
      const fbEmail = fbResponse.email;
      // 新增使用者 fb 資料
      const { hasedThirdPartyToken, tokenExpiredTime, thirdPartyLoginCustomToken } = hashThirdPartyLoginToken(thirdPartyAuthToken);
      try {
        const valiudUserId = await insertUser(thirdPartyLoginCustomToken, hasedThirdPartyToken, 'facebook', tokenExpiredTime, fbPicture, fbEmail, '', fbUserName);
        res.status(200).json({
          data: {
            accessToken: thirdPartyLoginCustomToken,
            expiredDate: tokenExpiredTime,
            user: {
              id: valiudUserId,
              provider: 'facebook',
              name: fbUserName,
              email: fbEmail,
              avatarUrl: fbPicture
            }
          }
        })
      } catch (error) {
        console.log(error);
        res.status(500).send('新增用戶FB資料錯誤');
      }
      break;
    default:
      break;
  }
}

// 註冊
const signupUser = async (req, res) => {
  const { username, email, password } = req.body;
  const { accessToken, tokenExpiredDate, hashedUserPassword } = generateAccessToken(email, password);
  try {
    const valiudUserId = await insertUser(accessToken, '', 'native', tokenExpiredDate, '', email, hashedUserPassword, username);
    // 剛註冊時沒有大頭貼網址，所以 avatar 直接給 ''
    res.status(200).json({
      data: {
        accessToken: accessToken,
        expiredDate: tokenExpiredDate,
        user: {
          id: valiudUserId,
          provider: 'native',
          name: username,
          email: email,
          avatarUrl: ''
        }
      }
    })
  } catch (err) {
    console.log(err)
    res.status(500).send(err.message)
  }
}

module.exports = {
  userSignin,
  signupUser
}