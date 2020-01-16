var express = require('express');
var router = express.Router();
const { signupUser } = require('../controller/users')

router.post('/signin', function (req, res, next) {
  
  res.send('登入')
})

router.post('/signup', signupUser);

module.exports = router;
