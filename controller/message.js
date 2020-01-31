const { listSpecifiedRoomMessages } = require('../model/message');
const { translationPromise } = require('../common/common');

const getMessagesForEachRoom = async (req, res) => {
  const { roomId } = req.query;
  try {
    const messageResult = await listSpecifiedRoomMessages(roomId);  
    res.status(200).json({
      data: messageResult
    })
  } catch (error) {
    throw error;
  }
}

const messageTranslation = async (req, res) => {
  const { messageContent, languageList, name, avatarUrl, fromUserId, createdTime }  = req.body;
  let translatePromiseList = [];
  for (let index = 0; index < languageList.length; index++) {
    const eachLanguage = languageList[index];
    translatePromiseList.push(translationPromise(messageContent, eachLanguage)); 
  }
  Promise.all(translatePromiseList)
  .then((translateResults) => {
    let translatedList = [];
    for (let i = 0; i < translateResults.length; i++) {
      translatedList.push(translateResults[i].translatedText);
    }
    console.log('翻譯訊息', translatedList);
    res.status(200).json({
      data: {
        messageFromUser: fromUserId,
        messageUserName: name,
        messageUserAvatar: avatarUrl,
        translationResults: translatedList,
        messageTime: createdTime
      }
    })
  })
  .catch((error) => {
    res.status(500).send(error.message);
  })
}

module.exports = {
  getMessagesForEachRoom,
  messageTranslation
}