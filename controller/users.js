const crypto = require('crypto');
require('dotenv').config();
const { insertUser, searchUser } = require('../model/users');
const { generateAccessToken } = require('../common/common');

// 登入
const userSignin = async (req, res, next) => {
  const { email, password } = req.body;
  const { hashedUserPassword } = generateAccessToken(email, password);
  try {
    const hasUser = await searchUser(email, hashedUserPassword);
    if (hasUser) {
      res.status(200).json({
        data: {
          email: email
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
}

// 註冊
const signupUser = async (req, res, next) => {
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