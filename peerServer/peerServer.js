let peerServerForWebRTC = {}
peerServerForWebRTC.getPeerServer = async function (peerServer, app) {
  app.use('/api', peerServer);

  peerServer.on('connection', (id) => {
    console.log('client peerId', id);
  }) 
  
  peerServer.on('disconnect', (id) => {
    console.log('peer id lose connection', id);
  })
};

module.exports = peerServerForWebRTC;