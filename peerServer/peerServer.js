const peerServerForWebRTC = {};
peerServerForWebRTC.getPeerServer = async (peerServer) => {
  peerServer.on('connection', (id) => {
    // eslint-disable-next-line no-console
    console.log('client peerId', id);
  });

  peerServer.on('disconnect', (id) => {
    // eslint-disable-next-line no-console
    console.log('peer id lose connection', id);
  });
};

module.exports = peerServerForWebRTC;