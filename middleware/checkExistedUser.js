const { checkExistingUserEmail } = require('../model/users');

// 過濾重複的 email 註冊
const checkExistedUser = async (req, res, next) => {
  const { email } = req.body;
  const hasAlreadyExisted = await checkExistingUserEmail(email);
  if (hasAlreadyExisted) {
    res.json({
      data: '該用戶已存在'
    })
  } else {
    next();
  }
}

module.exports = { 
  checkExistedUser
}