let peerServerForWebRTC = {}
peerServerForWebRTC.getPeerServer = async function (peerServer) {
  peerServer.on('connection', (id) => {
    console.log('connection id', id);
  })

  peerServer.on('disconnect', (id) => {
    console.log('disconnection id', id);
  })
};

module.exports = peerServerForWebRTC;