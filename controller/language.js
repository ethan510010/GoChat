const { updateUserLanguage } = require('../model/language');

const setUserPreferedLanguages = async (req, res) => {
  const { userId, selectedLanguage } = req.body;
  // eslint-disable-next-line no-useless-catch
  try {
    const updateLanguageResult = await updateUserLanguage(userId, selectedLanguage);
    if (updateLanguageResult) {
      res.status(200).json({
        data: 'success',
      });
    }
  } catch (error) {
    throw error;
  }
};

module.exports = {
  setUserPreferedLanguages,
};
