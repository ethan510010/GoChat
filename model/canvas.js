const { exec, handleRoomCanvas } = require('../db/mysql');

const handleRoomCanvasImage = async (canvasObj) => {
  const readQuery = `select * from canvas_image where roomId=${canvasObj.roomId}`;
  const insertQuery = `insert into canvas_image set roomId=${canvasObj.roomId}, canvasUrl='${canvasObj.canvasUrl}'`;
  const updateQuery = `update canvas_image set canvasUrl='${canvasObj.canvasUrl}' where roomId=${canvasObj.roomId}`;
  const canvasResult = await handleRoomCanvas(readQuery, insertQuery, updateQuery);
  return canvasResult;
}

const getRoomCanvasImg = async (roomId) => {
  const result = await exec(`
    select * from canvas_image where roomId=${roomId}
  `);
  return result[0].canvasUrl;
}

module.exports = {
  handleRoomCanvasImage,
  getRoomCanvasImg
}

