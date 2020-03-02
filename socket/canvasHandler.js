const { getRoomCanvasImg, deleteRoomCanvas } = require('../model/canvas')

const getRoomCanvas = (socketHandlerObj) => {
  const { socket } = socketHandlerObj;
  socket.on('getRoomCanvas', async (dataFromClient) => {
    const { roomId } = dataFromClient;
    const canvasUrl = await getRoomCanvasImg(roomId);
    socket.emit('showCanvas', { canvasUrl, roomId });
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
    // 把 DB 中該圖刪掉
    await deleteRoomCanvas(clearCanvasMsg.roomDetail.roomId);
    subNamespace.to(clearCanvasMsg.roomDetail.roomId).emit('clearDrawContent', clearCanvasMsg);
  })
}

module.exports = {
  getRoomCanvas,
  drawCanvas,
  eraseCanvas,
  clearCanvas
}