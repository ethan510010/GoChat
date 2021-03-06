// const { getRoomCanvasImg, deleteRoomCanvas, handleRoomCanvasImage } = require('../model/canvas');
const { truncateFakeData, createFakeData } = require('./setFakeData');
const app = require('../app');
const request = require('supertest');
const http = require('http');

const ioServer = require('../socket/socketAPI');
const ioClient = require('socket.io-client')
const server = http.createServer(app);
// 整個測試開始前把資料都弄回測試的
beforeAll(async () => {
  ioServer.getSocketio(server);
  server.listen(3000);
  await truncateFakeData();
  console.log('start insert fake data');
  await createFakeData();
});

// 測試使用者相關的 api
describe('users api intergration test', () => {

  // test('get canvas image exists', async () => {
  //   console.log('存在的 canvas')
  //   const result = await getRoomCanvasImg(2);
  //   expect(result).toBe('https://d1pj9pkj6g3ldu.cloudfront.net/1583463344489_canvas2')
  // })

  // test('get canvas image not exists', async () => {
  //   console.log('不存在的 canvas')
  //   const result = await getRoomCanvasImg(1);
  //   expect(result).toBe('');
  // })

  // test('delete canvas exists', async () => {
  //   console.log('刪除 canvas');
  //   const result = await deleteRoomCanvas(2);
  //   expect(result).toBe(true);
  // });

  // 用戶登入
  test('user sign in', async () => {
    const response = await request(app).post('/users/signin').send({
      email: 'user1@gmail.com',
      password: '123456',
      signinway: 'native'
    }).set('Content-Type', 'application/json')
      .expect(200)
    expect(response.body.data.user.name).toBe('user1');
    expect(response.body.data.user.avatarUrl).toBe('/images/defaultAvatar.png');
  });

  // 用戶註冊
  // test('user signup', async () => {
  //   const response = await request(app).post('/users/signup').send({
  //     username: 'user6',
  //     email: 'user6@gmail.com',
  //     password: '123456',
  //   }).set('Content-Type', 'application/json')
  //     .expect(200)
  //   expect(response.body.data.user).not.toBe(null);
  // })

  // 註冊但信箱重複
  // test('user sign up but user exists', async () => {
  //   const response = await request(app).post('/users/signup').send({
  //     username: 'user6',
  //     email: 'user1@gmail.com',
  //     password: '123456',
  //   }).set('Content-Type', 'application/json')
  //     .expect(200)
  //   expect(response.body.data).toBe('該用戶已存在');
  // })

  // 更新使用者選到的房間
  //   test('renew user selected namespace', async () => {
  //     const response = await request(app).put('/users/selectedNamespace').send({
  //       userId: 2,
  //       newSelectedNamespaceId: 2
  //     }).set('Content-Type', 'application/json')
  //       .expect(200)
  //       expect(response.body.userId).toBe(2);
  //       expect(response.body.updateNamespaceId).toBe(2);
  //   })

  //   // 更新使用者選擇的語言
  //   test('renew user selected language', async () => {
  //     const response = await request(app).put('/language/userPreferedLanguage').send({
  //       userId: 2,
  //       selectedLanguage: 'es'
  //     }).set('Content-Type', 'application/json')
  //       .expect(200)
  //       expect(response.body.data).toBe('success');
  //   })
  // });

  // describe('namespace api intergration test', () => {
  //   test('create namespace api', async () => {
  //     const response = await request(app).post('/namespace').send({
  //       namespaceName: 'Hello',
  //       createNamespaceUserId: 2
  //     })
  //     .expect(200)
  //     expect(response.body.data.newNamespaceName).toBe('Hello');
  //   })

  //   test('update namespace api', async () => {
  //     const response = await request(app).put('/namespace').send({
  //       updateNamespaceId: 4,
  //       updateNamespaceName: 'World'
  //     })
  //     .expect(200)
  //     expect(response.body.data.updateNamespaceName).toBe('World');
  //   })

  // socket 測試
  // 獲取歷史訊息
  test('get history messages', (done) => {
    const client1 = ioClient.connect(`http://localhost:3000/namespaceId=3`);
    client1.emit('getRoomHistory', {
      roomId: 3,
      userId: 1,
      userSelectedLanguge: 'en',
      page: 0,
      changeRoomMode: false
    });
    // https://codewithhugo.com/jest-array-object-match-contain/
    client1.on('showHistory', (historyInfo) => {
      expect(historyInfo.messages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            messageContent: '我剛剛忘了傳圖片',
            createdTime: 1583119924854,
            userId: 3,
            messageType: 'text',
            id: 2,
            language: 'en',
            translatedContent: 'I just forgot to pass the picture',
            provider: 'native',
            name: 'user3',
            email: 'user3@gmail.com',
            avatarUrl: 'https://user3Avatar.jpg',
          }),
          expect.objectContaining({
            messageContent: '你好',
            createdTime: 1583118500332,
            userId: 1,
            messageType: 'text',
            id: 1,
            language: 'en',
            translatedContent: 'Hello there',
            provider: 'native',
            name: 'user1',
            email: 'user1@gmail.com',
            avatarUrl: ''
          })
        ])
      )
      expect(historyInfo.messages.length).toBe(2);
      done();
    })
  })
  // join room 事件測試
  test('join room event', (done) => {
    const client1 = ioClient.connect(`http://localhost:3000/namespaceId=3`);
    const client2 = ioClient.connect(`http://localhost:3000/namespaceId=3`);
    const client3 = ioClient.connect(`http://localhost:3000/namespaceId=2`);
    client1.emit('join', {
      peerId: 'client1PeerId',
      roomInfo: {
        roomId: 3,
        roomTitle: 'general'
      },
      userInfo: {
        userId: 2,
        provider: 'native',
        expiredTime: 1584030705572,
        lastSelectedRoomId: 3,
        lastSelectedRoomTitle: 'general',
        selectedLanguage: 'zh-TW',
        name: 'user2',
        email: 'user2@gmail.com',
        avatarUrl: 'https://user2Avatar.jpg'
      }
    }, (callbackInfo) => {
      expect(callbackInfo.roomInfo).toEqual(
        expect.objectContaining({
          roomId: 3,
          roomTitle: 'general'
        }), 
      )
      expect(callbackInfo.userInfo).toEqual(
        expect.objectContaining({
          avatarUrl: "https://user2Avatar.jpg", 
          email: "user2@gmail.com", 
          expiredTime: 1584030705572, 
          lastSelectedRoomId: 3, 
          lastSelectedRoomTitle: "general", 
          name: "user2", 
          provider: "native", 
          selectedLanguage: "zh-TW"
        })
      )
      done()
    })
    client1.on('allPeersForRoom', (info) => {
      console.log(info.peersRoomPair)
      expect(info.peersRoomPair['3']).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            peerId: 'client1PeerId'
          }),
        ])
      )
      done()
    })
  })
})

afterAll(async (done) => {
  console.log('測試結束');
  done();
});