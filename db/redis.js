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
  // 也把訊息存到 redis，存之前先確定現在有幾組房間的 key，為了不讓 redis 爆掉，我們每次就最多維持 100 組房間，每一組最多 60 筆資料
  redisClient.keys('*', (err, keys) => {
    if (err) {
      console.log(err);
      return;
    }   
    if (keys.length >= 100) {
      console.log(keys);   
      redisClient.del(keys[0], (err, result) => {
        if (err) {
          console.log(err);
          return;
        }
        redisClient.lpush(`roomId${fullMessage.roomId}`, JSON.stringify(fullMessage));
        redisClient.ltrim(`roomId${fullMessage.roomId}`, 0, 59);
      }); 
    } else {
      redisClient.lpush(`roomId${fullMessage.roomId}`, JSON.stringify(fullMessage));
      redisClient.ltrim(`roomId${fullMessage.roomId}`, 0, 59);
    }
  })
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