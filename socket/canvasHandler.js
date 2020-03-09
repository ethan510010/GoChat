const { getRoomCanvasImg, deleteRoomCanvas } = require('../model/canvas')
const { handleBufferUpload } = require('./common');
const { handleRoomCanvasImage } = require('../model/canvas');

const getRoomCanvas = (socketHandlerObj) => {
  const { socket } = socketHandlerObj;
  socket.on('getRoomCanvas', async (dataFromClient) => {
    const { roomId } = dataFromClient;
    try {
      const canvasUrl = await getRoomCanvasImg(roomId);
      socket.emit('showCanvas', { canvasUrl, roomId });
    } catch (error) {
      socket.emit('customError', error);
    }
  })
}

const drawCanvas = (socketHandlerObj) => {
  const { socket, subNamespace } = socketHandlerObj;
  socket.on('draw', async (drawInfoFromClient) => {
    subNamespace.to(drawInfoFromClient.roomDetail.roomId).emit('showDrawData', drawInfoFromClient);
  })
}

const eraseCanvas = (socketHandlerObj) => {
  const { socket, subNamespace } = socketHandlerObj;
  socket.on('erase', (eraseInfo) => {
    subNamespace.to(eraseInfo.roomDetail.roomId).emit('eraseDrawData', eraseInfo);
  })
}

const clearCanvas = (socketHandlerObj) => {
  const { socket, subNamespace } = socketHandlerObj;
  socket.on('canvasClear', async (clearCanvasMsg) => {
    try {
      // 把 DB 中該圖刪掉
      await deleteRoomCanvas(clearCanvasMsg.roomDetail.roomId);
      subNamespace.to(clearCanvasMsg.roomDetail.roomId).emit('clearDrawContent', clearCanvasMsg);
    } catch (error) {
      subNamespace.to(clearCanvasMsg.roomDetail.roomId).emit('customError', error);
    }
  })
}

const saveEachTimeDrawResult = (socketHandlerObj) => {
  const { socket } = socketHandlerObj;
  socket.on('eachTimeDraw', async (eachTimeDrawResult) => {
    try {
      // 結果為一個 base64 的圖片
      const canvasImagePath = await handleBufferUpload(eachTimeDrawResult.drawPathUrl, `${Date.now()}_canvas${eachTimeDrawResult.roomDetail.roomId}`);
      await handleRoomCanvasImage({
        roomId: eachTimeDrawResult.roomDetail.roomId,
        canvasUrl: canvasImagePath
      })
    } catch (error) {
      console.log(error);
    }
  })
}

module.exports = {
  getRoomCanvas,
  drawCanvas,
  eraseCanvas,
  clearCanvas,
  saveEachTimeDrawResult
}