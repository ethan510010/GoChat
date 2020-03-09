const { exec } = require('../db/mysql');
const AppError = require('../common/customError');

const updateUserLanguage = async (userId, language) => {
  try {
    const updateResult = await exec(`
      update user set selected_language='${language}' 
      where id=${userId}
    `);
    return updateResult;
  } catch (error) {
    throw new AppError(error.message, 500);
  }
}

module.exports = {
  updateUserLanguage
}