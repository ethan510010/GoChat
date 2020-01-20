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

module.exports = {
  exec, 
  createGeneralUser,
  escape: mySQL.escape
}

