require('dotenv').config()

const host = process.env.environment === 'test' ? process.env.testMySQLHost : process.env.mysqlHost;
const user = process.env.environment === 'test' ? process.env.testMySQLUser : process.env.mysqlUser;
const password = process.env.environment === 'test' ? process.env.testMySQLPassword : process.env.mysqlPassword;
const port = process.env.environment === 'test' ? process.env.testMySQLPort : process.env.mysqlPort;
const database = process.env.environment === 'test' ? process.env.testMySQLDatabase : process.env.mysqlDatabase;

const mySQLConfig = {
  host: host,
  user: user,
  password: password,
  port: port,
  database: database
}

module.exports = {
  mySQLConfig
}