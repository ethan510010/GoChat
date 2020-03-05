const {
  exec,
  createConnection,
  startTransaction,
  query,
  commit } = require('../db/mysql');
const AppError = require('../common/customError');

const handleRoomCanvasImage = async (canvasObj) => {
  const readQuery = `select * from canvas_image where roomId=${canvasObj.roomId}`;
  const insertQuery = `insert into canvas_image set roomId=${canvasObj.roomId}, canvasUrl='${canvasObj.canvasUrl}'`;
  const updateQuery = `update canvas_image set canvasUrl='${canvasObj.canvasUrl}' where roomId=${canvasObj.roomId}`;
  try {
    const connection = await createConnection();
    await startTransaction(connection);
    const canvasSearchResult = await query(connection, readQuery);
    if (canvasSearchResult.length === 0) {
      const result = await query(connection, insertQuery);
      return await commit(connection, {
        insertResult: result
      });
    } else {
      const result = await query(connection, updateQuery);
      return await commit(connection, {
        updateResult: result
      })
    }
  } catch (error) {
    throw new AppError(error.message, 500);
  }
}

const getRoomCanvasImg = async (roomId) => {
  try {
    const result = await exec(`
      select * from canvas_image where roomId=${roomId}
    `);
    if (result[0]) {
      return result[0].canvasUrl
    } else {
      return ''
    }
  } catch (error) {
    throw new AppError(error.message, 500);
  }
}

const deleteRoomCanvas = async (roomId) => {
  try {
    const deleteResult = await exec(`
      delete from canvas_image where roomId=${roomId}
    `);
    if (deleteResult[0]) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    throw new AppError(error.message, 500);
  }
}

module.exports = {
  handleRoomCanvasImage,
  getRoomCanvasImg,
  deleteRoomCanvas
}

