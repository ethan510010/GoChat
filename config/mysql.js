require('dotenv').config();

const host = process.env.NODE_ENV === 'test' ? process.env.testMySQLHost : process.env.mysqlHost;
const user = process.env.NODE_ENV === 'test' ? process.env.testMySQLUser : process.env.mysqlUser;
const password = process.env.NODE_ENV === 'test' ? process.env.testMySQLPassword : process.env.mysqlPassword;
const port = process.env.NODE_ENV === 'test' ? process.env.testMySQLPort : process.env.mysqlPort;
const database = process.env.NODE_ENV === 'test' ? process.env.testMySQLDatabase : process.env.mysqlDatabase;

const mySQLConfig = {
  host,
  user,
  password,
  port,
  database,
};

module.exports = {
  mySQLConfig,
};
