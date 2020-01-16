const crypto = require('crypto');
require('dotenv').config();

const generateAccessToken = (email, password) => {
  // 加密使用者註冊的密碼
  const hashedUserPassordKey = crypto.createHash('sha256', process.env.cryptoSecret);
  const hashedUserPassword = hashedUserPassordKey.update(password).digest('hex');
  // 產生 token (用信箱、加密過的密碼、timeStamp)
  const hashedAccessTokenKey = crypto.createHash('sha256', process.env.cryptoSecret);
  const notHashedToken = email + hashedUserPassword + Date.now();
  const accessToken = hashedAccessTokenKey.update(notHashedToken).digest('hex');
  // 產生 expiredDate (這邊設定一天)
  const tokenExpiredDate = Date.now() + 86400000
  return {
    accessToken: accessToken,
    hashedUserPassword: hashedUserPassword,
    tokenExpiredDate: tokenExpiredDate
  }
}

module.exports = {
  generateAccessToken
}