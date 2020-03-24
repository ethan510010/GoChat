require('dotenv').config();

const redisConfig = {
  host: process.env.redisHost,
  port: process.env.redisPort,
};

module.exports = {
  redisConfig,
};
