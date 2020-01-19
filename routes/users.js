var express = require('express');
var router = express.Router();
const { userSignin, signupUser } = require('../controller/users');
const { checkExistedUser } = require('../middleware/checkExistedUser');

router.post('/signin', userSignin)

router.post('/signup', checkExistedUser, signupUser);

module.exports = router;
