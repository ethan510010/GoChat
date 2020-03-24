const roomPlayingVideoOverHandler = (socketHandlerObj) => {
  const { socket, subNamespace } = socketHandlerObj;
  socket.on('roomPlayingVideoOver', (roomPlayingOverInfo) => {
    const { roomId, roomPlayingVideo } = roomPlayingOverInfo;
    subNamespace.emit('getRoomPlayingVideoOver', {
      finisedVideoRoomId: roomId,
      roomPlayingVideo,
    });
  });
};

const roomIsPlayingHandler = (socketHandlerObj) => {
  const { socket } = socketHandlerObj;
  socket.on('roomIsPlaying', async (roomPlayingInfo) => {
    const { roomId, videoPlaying } = roomPlayingInfo;
    // 自己不需要接收
    socket.broadcast.to(roomId).emit('whichRoomPlayingVideo', {
      roomId,
      videoPlaying,
    });
  });
};

module.exports = {
  roomPlayingVideoOverHandler,
  roomIsPlayingHandler,
};
