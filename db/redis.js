// const redis = require('redis');
// const { redisConfig } = require('../config/redis');

// const redisClient = redis.createClient(redisConfig);

// redisClient.on('connect', () => {
//   // eslint-disable-next-line no-console
//   console.log('redis connection 成功');
// });

// redisClient.on('error', (err) => {
//   // eslint-disable-next-line no-console
//   console.log('redis connection 錯誤', err);
// });

// const saveCacheMessage = (fullMessage) => {
//   // 也把訊息存到 redis，存之前先確定現在有幾組房間的 key，為了不讓 redis 爆掉，我們每次就最多維持 100 組房間，每一組最多 60 筆資料
//   return new Promise((resolve, reject) => {
//     redisClient.keys('*', (err, keys) => {
//       if (err) {
//         reject(err);
//         return;
//       }
//       if (keys.length >= 100) {
//         redisClient.del(keys[0], (delError) => {
//           if (delError) {
//             reject(delError);
//             return;
//           }
//           redisClient.lpush(`roomId${fullMessage.roomId}`, JSON.stringify(fullMessage));
//           redisClient.ltrim(`roomId${fullMessage.roomId}`, 0, 59);
//           resolve();
//         });
//       } else {
//         redisClient.lpush(`roomId${fullMessage.roomId}`, JSON.stringify(fullMessage));
//         redisClient.ltrim(`roomId${fullMessage.roomId}`, 0, 59);
//         resolve();
//       }
//     });
//   });
// };

// const listEachRoomMessagesCache = (roomId, page) => {
//   return new Promise((resolve, reject) => {
//     const startIndex = page * 30;
//     const endIndex = (page + 1) * 30 - 1;
//     redisClient.lrange(`roomId${roomId}`, startIndex, endIndex, (err, result) => {
//       if (!err) {
//         resolve(result);
//       } else {
//         reject(err);
//       }
//     });
//   });
// };

// module.exports = {
//   saveCacheMessage,
//   listEachRoomMessagesCache,
// };
