const express = require('express');

const router = express.Router();
const {
  userSignin,
  signupUser,
  getUserProfile,
  updateAvatar,
  updateUserSelectNamespace,
} = require('../controller/users');
const { checkExistedUser } = require('../middleware/checkExistedUser');
const { checkTokenExpired } = require('../middleware/checkTokenExpired');

router.post('/users/signin', userSignin);

router.post('/users/signup', checkExistedUser, signupUser);

router.get('/users/profile', checkTokenExpired, getUserProfile);

router.put('/users/userAvatar', updateAvatar);

router.put('/users/selectedNamespace', updateUserSelectNamespace);

module.exports = router;
