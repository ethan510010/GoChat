const { getTokenExpiredTime } = require('../model/users')

const checkTokenExpired = async (req, res, next) => {
  const accessToken = req.headers.authorization.replace('Bearer ', '');
  const result = await getTokenExpiredTime(accessToken);
  if (result.expiredTime > 0) {
    const nowTimeStamp = Date.now();
    if (result.expiredTime > nowTimeStamp) {
      next()
    } else {
      res.json({
        data: 'token過期請重新登入'
      })
    }
  } else {
    res.json({
      data: '搜尋用戶有問題'
    })
  }
}

module.exports = {
  checkTokenExpired
}