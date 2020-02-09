const { redisConfig } = require('../config/redis');
const redis = require('redis');
const redisClient = redis.createClient(redisConfig);

redisClient.on('connect', () => {
  console.log('redis connection 成功');
})

redisClient.on('error', (err) => {
  console.log('redis connection 錯誤', err);
})

const saveCacheMessage = (fullMessage) => {
  // 也把訊息存到 redis
  // const saveMessageFormat = {
  //   messageId: fullMessage.messageId,
  //   messageContent: fullMessage.messageContent,
  //   createdTime: fullMessage.createdTime,
  //   userId: fullMessage.userId,
  //   provider: fullMessage.provider,
  //   name: fullMessage.name,
  //   email: fullMessage.email,
  //   avatarUrl: fullMessage.avatarUrl,
  //   messageType: fullMessage.messageType,
  //   translatedList: fullMessage.translatedList,
  //   roomId: fullMessage.roomId
  // }
  redisClient.lpush(`roomId${fullMessage.roomId}`, JSON.stringify(fullMessage));
  redisClient.ltrim(`roomId${fullMessage.roomId}`, 0, 59);
}

const listEachRoomMessagesCache = (roomId, page) => {
  return new Promise((resolve, reject) => {
    const startIndex = page * 30;
    const endIndex = (page + 1) * 30 - 1;
    redisClient.lrange(`roomId${roomId}`, startIndex, endIndex, function (err, result) {
      if (!err) {
        resolve(result);
      } else {
        reject(err);
      }
    })
  })
}

module.exports = {
  saveCacheMessage,
  listEachRoomMessagesCache
}