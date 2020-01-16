require('dotenv').config()

const mySQLConfig = {
  host: process.env.mysqlHost,
  user: process.env.mysqlUser,
  password: process.env.mysqlPassword,
  port: process.env.mysqlPort,
  database: process.env.mysqlDatabase
}

module.exports = {
  mySQLConfig
}