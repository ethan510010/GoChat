const crypto = require('crypto');
require('dotenv').config();
const { insertUser, searchFBUser, searchUser, getUserProfileByToken, updateUserToken, updateUserFBInfo, getAllUsers } = require('../model/users');
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
          // 重新登入要更新 token
          const updateResult = await updateUserToken(userId, accessToken, tokenExpiredDate);
          if (updateResult === true) {
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
              data: '更新Token失敗'
            })
          }
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
      const { hasedThirdPartyToken, tokenExpiredTime, thirdPartyLoginCustomToken } = hashThirdPartyLoginToken(thirdPartyAuthToken);
      try {
        // 如果該 fb user email 不存在就新增使用者 fb 資料，否則就單純更新
        let valiudUserId = 0;
        const { userId, hasFBUser } = await searchFBUser(fbEmail);
        if (hasFBUser) {
          validUserId = await updateUserFBInfo(userId, thirdPartyLoginCustomToken, hasedThirdPartyToken, 'facebook', tokenExpiredTime, fbPicture, fbEmail, fbUserName);
        } else {
          valiudUserId = await insertUser(thirdPartyLoginCustomToken, hasedThirdPartyToken, 'facebook', tokenExpiredTime, fbPicture, fbEmail, '', fbUserName);
        }
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

// 使用者資料
const getUserProfile = async (req, res) => {
  const accessToken = req.headers.authorization.replace('Bearer ', '');
  try {
    const userProfile = await getUserProfileByToken(accessToken);
    res.status(200).json({
      data: userProfile
    });
  } catch (error) {
    res.status(500).json({
      data: error.message
    })
  }
}

// 列出全部用戶
const listAllUsers = async (req, res) => {
  try {
    const allUsers = await getAllUsers();
    res.status(200).json({
      data: allUsers
    })
  } catch (error) {
    res.status(500).json({
      data: error.message
    })
  }
}

module.exports = {
  userSignin,
  signupUser,
  getUserProfile,
  listAllUsers
}