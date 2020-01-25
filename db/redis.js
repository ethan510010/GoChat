const { redisConfig } = require('../config/redis');
const redis = require('redis');
const redisClient = redis.createClient(redisConfig);

const saveCacheMessage = (fullMessage) => {
  // 也把訊息存到 redis
  const saveMessageFormat = {
    id: fullMessage.messageId,
    messageContent: fullMessage.messageContent,
    createdTime: fullMessage.messageTime,
    userId: fullMessage.userInfo.userId,
    roomId: fullMessage.roomDetail.roomId,
    provider: fullMessage.userInfo.provider,
    name: fullMessage.userInfo.name,
    email: fullMessage.userInfo.email,
    avatarUrl: fullMessage.userInfo.avatarUrl
  }
  redisClient.lpush(`roomId${fullMessage.roomDetail.roomId}`, JSON.stringify(saveMessageFormat));
  redisClient.ltrim(`roomId${fullMessage.roomDetail.roomId}`, 0, 29);
}

const listEachRoomMessagesCache = (roomId) => {
  return new Promise((resolve, reject) => {
    redisClient.lrange(`roomId${roomId}`, 0, 29, function (err, result) {
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