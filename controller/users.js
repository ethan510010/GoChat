require('dotenv').config();
const {
  insertUser,
  searchFBUser,
  searchUser,
  getUserProfileByToken,
  updateUserToken,
  updateUserFBInfo,
  getAllUsers,
  updateUserSelectedRoom,
  updateUserLastNamespace,
  updateUserNameOrAvatar
} = require('../model/users');
const { generateAccessToken, hashThirdPartyLoginToken, generateActiveToken } = require('../common/common');
const rp = require('request-promise');
const nodemailer = require('nodemailer');

// 登入
const userSignin = async (req, res) => {
  // 被邀請到某個 namespace 底下才會有該房間
  const { email, password, signinway, thirdPartyAuthToken, beInvitedRoomId } = req.body;
  switch (signinway) {
    case 'native':
      const { accessToken, tokenExpiredDate, hashedUserPassword } = generateAccessToken(email, password);
      try {
        const { userId, hasUser, name, avatarUrl, selectedLanguage, isActive } = await searchUser(email, hashedUserPassword);
        if (hasUser) {
          if (isActive) {
            // 重新登入要更新 token
            const updateResult = await updateUserToken(userId, accessToken, tokenExpiredDate, beInvitedRoomId);
            if (updateResult === true) {
              res.status(200).json({
                data: {
                  accessToken: accessToken,
                  expiredDate: tokenExpiredDate,
                  user: {
                    id: userId,
                    provider: 'native',
                    email: email,
                    name: name,
                    avatarUrl: avatarUrl,
                    selectedLanguage: selectedLanguage
                  }
                }
              })
            } else {
              res.status(200).json({
                data: '更新Token失敗'
              })
            }
          } else {
            // 代表此用戶沒有被激活
            res.status(200).json({
              data: {
                isActive: false
              }
            })
          }
        } else {
          res.status(200).json({
            data: '此用戶不存在'
          })
        }
      } catch (err) {
        console.log(err.message);
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
        // 如果該 fb user email 不存在就新增使用者 fb 資料 (類似註冊)，否則就單純更新
        let validUserId = 0;
        let validSelectedLanguage = '';
        const { userId, hasFBUser, selectedLanguage } = await searchFBUser(fbEmail);
        if (hasFBUser) {
          validUserId = await updateUserFBInfo(
            userId,
            thirdPartyLoginCustomToken,
            hasedThirdPartyToken,
            'facebook',
            tokenExpiredTime,
            fbPicture,
            fbEmail,
            fbUserName,
            beInvitedRoomId
          );
          validSelectedLanguage = selectedLanguage;
        } else {
          const { userId, selectedLanguage } = await insertUser(
            thirdPartyLoginCustomToken,
            hasedThirdPartyToken,
            'facebook',
            tokenExpiredTime,
            fbPicture,
            fbEmail,
            '',
            fbUserName,
            beInvitedRoomId
          );
          validUserId = userId;
          validSelectedLanguage = selectedLanguage;
        }
        res.status(200).json({
          data: {
            accessToken: thirdPartyLoginCustomToken,
            expiredDate: tokenExpiredTime,
            user: {
              id: validUserId,
              provider: 'facebook',
              name: fbUserName,
              email: fbEmail,
              avatarUrl: fbPicture,
              selectedLanguage: validSelectedLanguage
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
  // 只有被邀請的用戶才會有 beInvitedRoomId
  const { username, email, password, beInvitedRoomId } = req.body;
  const { accessToken, tokenExpiredDate, hashedUserPassword } = generateAccessToken(email, password);
  try {
    const activeToken = generateActiveToken()
    const { userId, selectedLanguage } = await insertUser(
      accessToken,
      '',
      'native',
      tokenExpiredDate,
      '',
      email,
      hashedUserPassword,
      username,
      beInvitedRoomId,
      activeToken
    );
    // 剛註冊時沒有大頭貼網址，所以 avatar 預設我們給 '/images/defaultAvatar.png'
    // 寄送驗證信
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      requireTLS: true,
      auth: {
        user: process.env.gmailAccount,
        pass: process.env.gmailPassword
      }
    });
    let inviteUrl ='';
    if (process.env.environment === 'development') {
      inviteUrl = `${process.env.devHost}?activeToken=${activeToken}`;
    } else if (process.env.environment === 'production') {
      inviteUrl = `${process.env.prodHost}?activeToken=${activeToken}`;
    }
    const mailOptions = {
      from: process.env.gmailAccount,
      to: email,
      subject: `Activate the account you register for Chatvas`,
      text: `active account link: ${inviteUrl}`
    }
    transporter.sendMail(mailOptions, (err, data) => {
      if (err) {
        res.status(500).send(err.message);
      } else {
        res.status(200).json({
          data: {
            accessToken: accessToken,
            expiredDate: tokenExpiredDate,
            user: {
              id: userId,
              provider: 'native',
              name: username,
              email: email,
              avatarUrl: '/images/defaultAvatar.png',
              selectedLanguage: selectedLanguage
            }
          }
        })
      }
    })
    // res.status(200).json({
    //   data: {
    //     accessToken: accessToken,
    //     expiredDate: tokenExpiredDate,
    //     user: {
    //       id: userId,
    //       provider: 'native',
    //       name: username,
    //       email: email,
    //       avatarUrl: '/images/defaultAvatar.png',
    //       selectedLanguage: selectedLanguage
    //     }
    //   }
    // })
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

// 更新使用者大頭貼
const updateAvatar = async (req, res) => {
  const userAvatarUrl = `https://d1pj9pkj6g3ldu.cloudfront.net/${req.files.userAvatar[0].key}`;
  const userId = req.body.userId;
  try {
    const updateResult = await updateUserNameOrAvatar(userId, undefined, userAvatarUrl);
    // const updateResult = await updateUserAvatar(userId, userAvatarUrl);
    if (updateResult) {
      res.status(200).json({
        data: {
          userId: userId,
          avatarUrl: userAvatarUrl
        }
      })
    }
  } catch (error) {
    res.status(500).send(error.message)
  }
}

const updateUserRoom = async (req, res) => {
  const { userId, roomId } = req.body;
  try {
    const updateResult = await updateUserSelectedRoom(userId, roomId);
    if (updateResult) {
      res.status(200).json({
        data: {
          userId: userId,
          selectedRoomId: roomId
        }
      })
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
}

// 更新使用者選擇的 namespace
const updateUserSelectNamespace = async (req, res) => {
  const { userId, newSelectedNamespaceId } = req.body;
  try {
    await updateUserLastNamespace(userId, newSelectedNamespaceId);
    res.status(200).send({
      userId: userId,
      updateNamespaceId: newSelectedNamespaceId
    })
  } catch (error) {
    res.status(500).send(error.message);
  }
}

module.exports = {
  userSignin,
  signupUser,
  getUserProfile,
  listAllUsers,
  updateAvatar,
  updateUserRoom,
  updateUserSelectNamespace
}