const { exec } = require('../db/mysql');

const updateUserLanguage = async (userId, language) => {
  const updateResult = await exec(`
    update user set selected_language='${language}' 
    where id=${userId}
  `);
  return updateResult;
}

module.exports = {
  updateUserLanguage
}