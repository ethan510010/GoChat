const crypto = require('crypto');
require('dotenv').config();
const googleTranslate = require('google-translate')(process.env.googleTranslateAPIKey);

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

// 其實上下兩個方法非常像，但刻意分開寫是為了之後看 code 比較方便
const hashThirdPartyLoginToken = (originalToken) => {
  // 加密使用者註冊的第三方原始 token 
  const hashedKey = crypto.createHash('sha256', process.env.cryptoSecret);
  const hasedThirdPartyToken = hashedKey.update(originalToken).digest('hex');
  // 產生我們自己要給使用者的 token
  const hashedAccessTokenKey = crypto.createHash('sha256', process.env.cryptoSecret);
  const mixedInfo = originalToken + Date.now()
  const thirdPartyLoginCustomToken = hashedAccessTokenKey.update(mixedInfo).digest('hex');
  const tokenExpiredTime = Date.now() + 86400000;
  return {
    thirdPartyLoginCustomToken: thirdPartyLoginCustomToken,
    hasedThirdPartyToken: hasedThirdPartyToken,
    tokenExpiredTime: tokenExpiredTime
  }
}

const translationPromise = (inputText, targetLanguage) => {
  return new Promise((resolve, reject) => {
    // googleTranslate.detectLanguage(inputText, function (err, detection) {
    //   if (err) {
    //     reject(err);
    //     return;
    //   }
    //   console.log('detection', detection);
    // });
    googleTranslate.translate(inputText, targetLanguage, function (err, translation) {
      if (err) {
        reject(err);
        return;
      }
      resolve(translation);
    });
  })
}

module.exports = {
  generateAccessToken,
  hashThirdPartyLoginToken,
  translationPromise
}