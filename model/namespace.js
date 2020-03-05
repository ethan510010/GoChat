const {
  exec,
  createConnection,
  startTransaction,
  query,
  commit } = require('../db/mysql');
const AppError = require('../common/customError');

const getNamespacesForUser = async (userId) => {
  try {
    const namespacesOfUser = await exec(`
      select DISTINCT namespaceId, namespace.namespaceName from user_room_junction inner join room
      on user_room_junction.roomId=room.id
      inner join namespace
      on room.namespaceId=namespace.id where userId=${userId} order by namespaceId
    `);
    // 列出該用戶底下全部的 namespace，但 systemDefault 預設的過濾掉 (systemDefault 的 namespaceId 為 1)
    if (namespacesOfUser.length > 0) {
      // 為系統預設的
      console.log(namespacesOfUser)
      if (namespacesOfUser[0].namespaceId === 1) {
        namespacesOfUser.splice(0, 1);
      }
      return namespacesOfUser;
    } else {
      return [];
    }
  } catch (error) {
    throw new AppError(error.message, 500);
  }
}

// 每個新建的 namespace 都會綁定一個 general room，而且創建 namespace 的人 DB 也要綁定該 namespace
const createNamespaceAndBindingGeneralRoom = async (namespaceName, createNamespaceUserId) => {
  try {
    const connection = await createConnection();
    await startTransaction(connection);
    const createNamespaceResult = await query(connection, 'insert into namespace set namespaceName=?', [namespaceName]);
    const createNamespaceId = createNamespaceResult.insertId;
    const newNamespaceGeneralRoomResult = await query(connection, `insert into room set name='general', namespaceId=${createNamespaceId}`);
    const newNamespaceGeneralRoomId = newNamespaceGeneralRoomResult.insertId;
    await query(connection, `update user set last_selected_room_id=${newNamespaceGeneralRoomId} where id=${createNamespaceUserId}`);
    await query(connection, `insert into user_room_junction set roomId=${newNamespaceGeneralRoomId}, userId=${createNamespaceUserId}`);
    const commitResult = await commit(connection, {
      newNamespaceId: createNamespaceId,
      newDefaultRoomId: newNamespaceGeneralRoomId,
      newNamespaceName: namespaceName
    });
    return commitResult;
  } catch (error) {
    throw new AppError(error.message, 500);
  }
}

// 更新 namespace
const renewNamespace = async (namespaceId, namespaceName) => {
  try {
    const connection = await createConnection();
    await startTransaction(connection);
    const selectDefaulRoomResults = await query(connection, `select room.id as roomId, room.name as roomName, namespace.id as namespaceId, namespace.namespaceName from room
      inner join namespace
      on room.namespaceId=namespace.id
      where namespaceId=${namespaceId} order by roomId`);
    if (selectDefaulRoomResults.length > 0) {
      const defaultRoomId = selectDefaulRoomResults[0].roomId;
      await query(connection, `update namespace set namespaceName=? where id=${namespaceId}`, [namespaceName]);
      await commit(connection, {
        defaultRoomId: defaultRoomId
      });
      return defaultRoomId;
    }
  } catch (error) {
    throw new AppError(error.message, 500);
  }
}

module.exports = {
  getNamespacesForUser,
  createNamespaceAndBindingGeneralRoom,
  renewNamespace
}