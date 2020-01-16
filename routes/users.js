var express = require('express');
var router = express.Router();
const { signupUser } = require('../controller/users');
const { checkExistedUser } = require('../middleware/checkExistedUser');

router.post('/signin', function (req, res, next) {
  res.send('登入')
})

router.post('/signup', checkExistedUser, signupUser);

module.exports = router;
