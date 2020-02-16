const { exec, createNameSpaceTransaction } = require('../db/mysql');

const getNamespacesForUser = async (userId) => {
  const namespacesOfUser = await exec(`
    select user_room_junction.roomId as roomId, room.name as roomName, namespace.id as namespaceId, namespace.namespaceName as namespaceName from user_room_junction inner join room
    on user_room_junction.roomId=room.id
    inner join namespace
    on room.namespaceId=namespace.id where userId=${userId} order by namespaceId
  `);
  // 列出該用戶底下全部的 namespace，但 systemDefault 預設的過濾掉
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
}

// 每個新建的 namespace 都會綁定一個 general room，而且創建 namespace 的人 DB 也要綁定該 namespace
const createNamespaceAndBindingGeneralRoom = async (namespaceName, createNamespaceUserId) => {
  const insertNamespaceResult = await createNameSpaceTransaction('insert into namespace set namespaceName=?', namespaceName, createNamespaceUserId);
  return insertNamespaceResult;
}

module.exports = {
  getNamespacesForUser,
  createNamespaceAndBindingGeneralRoom
}