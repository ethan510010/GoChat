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
  if (result[0]) {
    return result[0].canvasUrl
  } else {
    return ''
  }
}

const deleteRoomCanvas = async (roomId) => {
  const deleteResult = await exec(`
    delete from canvas_image where roomId=${roomId}
  `);
  if (deleteResult[0]) {
    return true;
  } else {
    return false;
  }
}

module.exports = {
  handleRoomCanvasImage,
  getRoomCanvasImg,
  deleteRoomCanvas
}

