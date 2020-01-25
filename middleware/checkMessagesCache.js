const { listEachRoomMessagesCache } = require('../db/redis');

const checkMessagesCache = async (req, res, next) => {
  const { roomId } = req.query;
  try {
    const messagesCache = await listEachRoomMessagesCache(roomId);
    // 目前這樣的判斷僅僅在沒有 paging 的情況會對，有 paging 這樣邏輯會錯
    if (messagesCache.length > 0) {
      // 從 redis 取出來是 string
      const responseMessages = messagesCache.map((messageStr) => {
        return JSON.parse(messageStr)
      })
      res.status(200).json({
        data: responseMessages
      })
    } else {
      next()
    }
  } catch (error) {
    throw error;
  }
}

module.exports = {
  checkMessagesCache
}