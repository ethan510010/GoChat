const mySQL = require('mysql');
const { mySQLConfig } = require('../config/mysql')

const mySQLPool = mySQL.createPool(mySQLConfig);

module.exports = mySQLPool;

