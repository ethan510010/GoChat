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
  const { messageContent, languageList, name, avatarUrl, fromUserId, createdTime, messageType } = req.body;
  if (messageType === 'text') {
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
            chatResults: translatedList,
            messageTime: createdTime,
            messageType: messageType
          }
        })
      })
      .catch((error) => {
        res.status(500).send(error.message);
      })
  } else if (messageType === 'image') {
    res.status(200).json({
      data: {
        messageFromUser: fromUserId,
        messageUserName: name,
        messageUserAvatar: avatarUrl,
        chatResults: [messageContent],
        messageTime: createdTime,
        messageType: messageType
      }
    })
  }

}

const uploadMessageImage = async (req, res) => {
  if (req.files.messageImage[0].key) {
    console.log('圖片訊息路徑', req.files.messageImage[0].key);
    res.status(200).json({
      data: `https://d23udu0vnjg8rb.cloudfront.net/${req.files.messageImage[0].key}`
    })
  } else {
    res.status(500).send(error.message);
  }
}

module.exports = {
  getMessagesForEachRoom,
  messageTranslation,
  uploadMessageImage
}