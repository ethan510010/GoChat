var express = require('express');
var router = express.Router();
const { 
  userSignin, 
  signupUser, 
  getUserProfile, 
  listAllUsers, 
  updateAvatar, 
  updateUserRoom,
  updateUserSelectNamespace 
} = require('../controller/users');
const { checkExistedUser } = require('../middleware/checkExistedUser');
const { checkTokenExpired } = require('../middleware/checkTokenExpired');

router.post('/signin', userSignin)

router.post('/signup', checkExistedUser, signupUser);

router.get('/profile', checkTokenExpired, getUserProfile);

router.get('/listUsers', listAllUsers);

router.put('/renewUserAvatar', updateAvatar);

router.put('/renewUserSelectedRoom', updateUserRoom);

router.put('/updateSelectedNamespace', updateUserSelectNamespace);

module.exports = router;
