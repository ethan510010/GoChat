// Socket.io 有關的 code
const socket = io.connect('ws://localhost:3000');

socket.on('connect', () => {
  console.log('socket 連線成功')
})

socket.on('message', (dataFromServer) => {
  console.log(dataFromServer)
})

// restful api 拿取必要資訊
// 1. userProfile
