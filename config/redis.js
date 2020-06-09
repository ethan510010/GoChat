// require('dotenv').config();

// const redisConfig = {
//   host: process.env.redisHost,
//   port: process.env.redisPort,
//   retry_strategy: (options) => {
//     if (options.error && options.error.code === 'ECONNREFUSED') {
//       // End reconnecting on a specific error and flush all commands with
//       // a individual error
//       console.log('The server refused to reconnect');
//       return new Error('The server refused the connection');
//     }
//     if (options.total_retry_time > 1000 * 60 * 60) {
//       // End reconnecting after a specific timeout and flush all commands
//       // with a individual error
//       console.log('Retry time exhausted');
//       return new Error('Retry time exhausted');
//     }
//     if (options.attempt > 10) {
//       // End reconnecting with built in error
//       return undefined;
//     }
//     // reconnect after
//     return Math.min(options.attempt * 100, 3000);
//   },
// };

// module.exports = {
//   redisConfig,
// };
