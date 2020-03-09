const http = require('http');
const app = require('../app');
const { truncateFakeData, createFakeData } = require('./setFakeData');
const ioServer = require('../socket/socketAPI');
const server = http.createServer(app);
const request = require('supertest');
const requester = request(app);

// 整個測試開始前把資料都弄回測試的
beforeAll(async () => {
  ioServer.getSocketio(server);
  server.listen(3000);
  console.log('start before all')
  await truncateFakeData();
  console.log('start insert fake data');
  await createFakeData();
});

after(async () => {
  
})

module.exports = {
  requester
}