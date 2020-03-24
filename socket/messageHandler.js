const { handleBufferUpload } = require('./common');
const { insertChatMessage } = require('../model/chatContent');
const { translationPromise } = require('../common/common');
const { saveTranslatedContent } = require('../model/message');
const { saveCacheMessage } = require('../db/redis');

const messageHandler = (socketHandlerObj) => {
  const { subNamespace, socket } = socketHandlerObj;
  socket.on('clientMessage', async (dataFromClient) => {
    // 用來處理要存到 redis cache 的每一筆資料
    const messageRedisCache = {};
    // 儲存訊息到 mySQL
    const messageObj = {
      createdTime: dataFromClient.messageTime,
      messageContent: dataFromClient.messageContent,
      userId: dataFromClient.userInfo.userId,
      roomId: dataFromClient.roomDetail.roomId,
      messageType: dataFromClient.messageType,
      fileName: dataFromClient.fileName,
    };
    if (dataFromClient.messageType === 'image') {
      const s3Path = await handleBufferUpload(dataFromClient.messageContent, `${dataFromClient.messageTime}_${dataFromClient.fileName}`);
      messageObj.messageContent = s3Path;
    }
    try {
      const createMessageResult = await insertChatMessage(messageObj);
      if (createMessageResult) {
        dataFromClient.messageId = createMessageResult.insertId;
        const languageArrangement = ['en', 'zh-TW', 'ja', 'es'];
        if (dataFromClient.messageType === 'text') {
          const englishPromise = translationPromise(dataFromClient.messageContent, 'en');
          const chinesePromise = translationPromise(dataFromClient.messageContent, 'zh-TW');
          const japanesePromise = translationPromise(dataFromClient.messageContent, 'ja');
          const spanishPromise = translationPromise(dataFromClient.messageContent, 'es');
          const transList = await Promise.all([englishPromise, chinesePromise, japanesePromise, spanishPromise]);
          for (let i = 0; i < transList.length; i++) {
            const eachTransResult = transList[i].translatedText;
            const eachLanguage = languageArrangement[i];
            await saveTranslatedContent({
              messageId: createMessageResult.insertId,
              language: eachLanguage,
              translatedContent: eachTransResult,
            });
            dataFromClient[eachLanguage] = eachTransResult;
            messageRedisCache[eachLanguage] = eachTransResult;
          }
        } else if (dataFromClient.messageType === 'image') {
          for (let i = 0; i < languageArrangement.length; i++) {
            const eachLanguage = languageArrangement[i];
            await saveTranslatedContent({
              messageId: createMessageResult.insertId,
              language: eachLanguage,
              translatedContent: messageObj.messageContent,
            });
            messageRedisCache[eachLanguage] = messageObj.messageContent;
          }
        }

        // 組裝 redis cache 結構 (翻譯的部分在上面組裝)
        messageRedisCache.messageContent = messageObj.messageContent;
        messageRedisCache.createdTime = messageObj.createdTime,
        messageRedisCache.userId = messageObj.userId;
        messageRedisCache.messageType = messageObj.messageType;
        messageRedisCache.messageId = createMessageResult.insertId;
        messageRedisCache.provider = dataFromClient.userInfo.provider;
        messageRedisCache.name = dataFromClient.userInfo.name;
        messageRedisCache.email = dataFromClient.userInfo.email;
        messageRedisCache.avatarUrl = dataFromClient.userInfo.avatarUrl;
        messageRedisCache.roomId = dataFromClient.roomDetail.roomId;
        console.log('組裝的 cache 訊息', messageRedisCache);
        // // 儲存成功發送出去，並存到 redis
        saveCacheMessage(messageRedisCache);
        subNamespace.to(dataFromClient.roomDetail.roomId).emit('message', dataFromClient);
        // 要讓不在該房間的但擁有該房間的用戶可以收到通知，利用 broadcast (新訊息提示功能)
        socket.broadcast.emit('newMessageMention', {
          newMessageRoomTitle: dataFromClient.roomDetail.roomTitle,
          newMessageRoomId: dataFromClient.roomDetail.roomId,
          messageTime: dataFromClient.messageTime,
          newMessageContent: dataFromClient.messageContent,
          messageFromUser: dataFromClient.userInfo.name,
        });
      }
    } catch (error) {
      socket.emit('customError', error);
    }
  });
};

module.exports = {
  messageHandler,
};
