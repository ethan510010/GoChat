const socket_io = require('socket.io');

let socketio = {};
// 獲取io
socketio.getSocketio = function(server) {
  const io = socket_io.listen(server);
  io.on('connection', function(socket) {
    console.log('a user connected')
    socket.emit('message', '你好')
  })
};

module.exports = socketio;
