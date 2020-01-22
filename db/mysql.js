const mySQL = require('mysql');
const { mySQLConfig } = require('../config/mysql')

const mySQLPool = mySQL.createPool(mySQLConfig);

// generalUse
function exec(sql) {
  return new Promise((resolve, reject) => {
    mySQLPool.query(sql, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    })
  })
}

// Create Room and Binding user
function createRoomTransaction(roomSQL, junstionSQL, userIdList) {
  return new Promise((resolve, reject) => {
    mySQLPool.getConnection((err, connection) => {
      if (err) {
        connection.release();
        reject(err);
        return;
      }
      connection.beginTransaction((transactionErr) => {
        if (transactionErr) {
          return connection.rollback(() => {
            connection.release();
            reject(transactionErr);
          })
        }
        connection.query(roomSQL, (err, result) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              reject(err);
            })
          }
          const roomId = result.insertId;
          for (let index = 0; index < userIdList.length; index++) {
            const eachUserId = userIdList[index];
            connection.query(junstionSQL, [roomId, eachUserId], (err, result) => {
              if (err) {
                return connection.rollback(() => {
                  connection.release();
                  reject(err);
                })
              }
            })
          }
          connection.commit((commitErr) => {
            if (commitErr) {
              return connection.rollback(() => {
                connection.release();
                reject(commitErr);
              })
            }
            resolve({
              channelId: roomId, 
              allUsers: userIdList});
            connection.release();
            console.log('新增 Room 及綁定 User 成功');
          })
        })
      })
    })
  })
}

// Create User use
function createGeneralUser(userBasicSQL, userDetailsSQL, userInfoObj) {
  return new Promise((resolve, reject) => {
    mySQLPool.getConnection((err, connection) => {
      if (err) {
        connection.release();
        reject(err);
        return;
      }
      connection.beginTransaction((transactionErr) => {
        // 有錯誤
        if (transactionErr) {
          return connection.rollback(() => {
            connection.release();
            reject(transactionErr);
          })
        }
        // 沒有錯誤
        connection.query(userBasicSQL, [userInfoObj.accessToken, 
          userInfoObj.fbAccessToken, 
          userInfoObj.provider, 
          userInfoObj.expiredDate], (insertBasicErr, result) => {
          if (insertBasicErr) {
            return connection.rollback(() => {
              connection.release();
              reject(insertBasicErr);
            })
          }
          const userId = result.insertId;
          // 要帶進去的參數根據 provider 變換
          let parameters = [];
          switch (userInfoObj.provider) {
            case 'native':
              parameters = [userInfoObj.avatarUrl, userInfoObj.email, userInfoObj.password, userInfoObj.name, userId]
              break;
            case 'facebook':
              parameters = [userInfoObj.avatarUrl, userInfoObj.name, userInfoObj.email, userId]
              break;
          }
          connection.query(userDetailsSQL, parameters, (insertDetailErr, result) => {
            if (insertDetailErr) {
              return connection.rollback(() => {
                connection.release();
                reject(insertDetailErr);
              })
            }
            connection.commit((commitErr) => {
              if (commitErr) {
                return connection.rollback(() => {
                  connection.release();
                  reject(commitErr);
                })
              }
              console.log('新增用戶成功')
              resolve(userId);
              connection.release();
            })
          })
        })
      })
    })
  })
}

// update FBUser use
function updateFBUserInfo(generalUserSQL, fbUserSQL, userDetailObj) {
  return new Promise((resolve, reject) => {
    mySQLPool.getConnection((err, connection) => {
      if (err) {
        connection.release();
        reject(err);
        return;
      }
      connection.beginTransaction((transactionErr) => {
        // 有錯誤
        if (transactionErr) {
          return connection.rollback(() => {
            connection.release();
            reject(transactionErr);
          })
        }
        // 沒有錯誤
        connection.query(generalUserSQL, [userDetailObj.accessToken, 
          userDetailObj.fbAccessToken, 
          userDetailObj.provider, 
          userDetailObj.expiredDate], (insertBasicErr, result) => {
          if (insertBasicErr) {
            return connection.rollback(() => {
              connection.release();
              reject(insertBasicErr);
            })
          }
          connection.query(fbUserSQL, [userDetailObj.avatarUrl, userDetailObj.fbUserName, userDetailObj.fbEmail], (insertDetailErr, result) => {
            if (insertDetailErr) {
              return connection.rollback(() => {
                connection.release();
                reject(insertDetailErr);
              })
            }
            connection.commit((commitErr) => {
              if (commitErr) {
                return connection.rollback(() => {
                  connection.release();
                  reject(commitErr);
                })
              }
              console.log('更新FB用戶成功')
              resolve(userDetailObj.userId);
              connection.release();
            })
          })
        })
      })
    })
  })
}

module.exports = {
  exec, 
  createGeneralUser,
  updateFBUserInfo,
  escape: mySQL.escape,
  createRoomTransaction
}

