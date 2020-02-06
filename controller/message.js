const { listSpecifiedRoomMessages, saveTranslatedContent } = require('../model/message');
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
  const { messageId, messageContent, languageList, name, avatarUrl, fromUserId, createdTime, messageType } = req.body;
  if (messageType === 'text') {
    try {
      const translatedWord = await translationPromise(messageContent, languageList);
      // 把翻譯訊息存起來
      const insertTranslateResult = await saveTranslatedContent({
        messageId: messageId,
        language: languageList,
        translatedContent: translatedWord.translatedText
      });
      res.status(200).json({
        data: {
          messageFromUser: fromUserId,
          messageUserName: name,
          messageUserAvatar: avatarUrl,
          originalMessage: messageContent,
          translatedWord: translatedWord.translatedText,
          messageTime: createdTime,
          messageType: messageType
        }
      })
    } catch (error) {
      res.status(500).send(error.message);
    }
  } else if (messageType === 'image') {
    res.status(200).json({
      data: {
        messageFromUser: fromUserId,
        messageUserName: name,
        messageUserAvatar: avatarUrl,
        originalMessage: messageContent,
        translatedWord: [],
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