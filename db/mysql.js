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
    });
  });
}

function execWithParaObj(sql, paraObj) {
  return new Promise((resolve, reject) => {
    mySQLPool.query(sql, paraObj, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });
}

// 測試封裝 transaction
function createConnection() {
  return new Promise((resolve, reject) => {
    mySQLPool.getConnection((err, connection) => {
      if (err) {
        connection.release();
        reject(err);
        return;
      }
      resolve(connection);
    });
  });
}

function startTransaction(connection) {
  return new Promise((resolve, reject) => {
    connection.beginTransaction((transactionErr) => {
      if (transactionErr) {
        return connection.rollback(() => {
          connection.release();
          reject(transactionErr);
        });
      }
      resolve();
    });
  });
}

function query(connection, sql, params) {
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err, result) => {
      if (err) {
        return connection.rollback(() => {
          connection.release();
          reject(err);
        });
      }
      resolve(result);
    });
  });
}

function commit(connection, customResult) {
  return new Promise((resolve, reject) => {
    connection.commit((commitErr) => {
      if (commitErr) {
        return connection.rollback(() => {
          connection.release();
          reject(commitErr);
        })
      }
      resolve(customResult);
      connection.release();
      console.log('transaction 完成');
    });
  });
}

module.exports = {
  exec,
  execWithParaObj,
  escape: mySQL.escape,
  createConnection,
  startTransaction,
  query,
  commit,
};
