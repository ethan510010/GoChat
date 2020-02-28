var express = require('express');
var router = express.Router();
const { activateUser } = require('../controller/activateUser');
/* GET home page. */
router.get('/', async (req, res) => {
  res.render('main');
})

router.get('/signin', activateUser);

router.get('/signup', activateUser);

module.exports = router;
