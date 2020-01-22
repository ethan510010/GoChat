var express = require('express');
var router = express.Router();
const { userSignin, signupUser, getUserProfile, listAllUsers } = require('../controller/users');
const { checkExistedUser } = require('../middleware/checkExistedUser');
const { checkTokenExpired } = require('../middleware/checkTokenExpired');

router.post('/signin', userSignin)

router.post('/signup', checkExistedUser, signupUser);

router.get('/profile', checkTokenExpired, getUserProfile);

router.get('/listUsers', listAllUsers);

module.exports = router;
