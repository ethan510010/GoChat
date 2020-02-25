const { searchUserTokenExpiredTime } = require('../model/users')

const checkTokenExpired = async (req, res, next) => {
  // 取得 cookie 裡面的 token
  const accessToken = req.cookies.access_token;
  const userId = req.query.userId;
  const { expiredDate } = await searchUserTokenExpiredTime(accessToken, userId);
  if (expiredDate && Date.now() < expiredDate) {
    next();
  } else {
    res.redirect('/');
  }
}

module.exports = {
  checkTokenExpired
}