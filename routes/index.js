var express = require('express');
var router = express.Router();
const { activateGeneralUser } = require('../model/users');
/* GET home page. */
router.get('/', async (req, res) => {
  // 如果是帶有 activeToken 的
  const { activeToken } = req.query;
  if (activeToken) {
    try {
      await activateGeneralUser(activeToken)  ;
    } catch (error) {
      throw error;
    }
  }
  res.render('home', { title: 'Home' });
});

module.exports = router;
