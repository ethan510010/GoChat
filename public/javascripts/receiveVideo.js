// let reveicePeerConnection;
// const receiverConfig = {
//   iceServers: [
//     {
//       urls: ['stun:stun.l.google.com:19302']
//     }
//   ]
// }

// const receiveVideoTag = document.getElementById('receiverVideo');

// socket.on('videoBroadcast', (broadCaster) => {
//   console.log('收到廣播');
//   const acceptCall = confirm('Do you want to answer the call?');
//   if (acceptCall) {
//     socket.emit('watcher', broadCaster);
//   }
// })

// socket.on("offer", (id, description) => {
//   reveicePeerConnection = new RTCPeerConnection(receiverConfig);
//   reveicePeerConnection
//     .setRemoteDescription(description)
//     .then(() => reveicePeerConnection.createAnswer())
//     .then(sdp => reveicePeerConnection.setLocalDescription(sdp))
//     .then(() => {
//       socket.emit("answer", id, reveicePeerConnection.localDescription);
//     });
//     reveicePeerConnection.ontrack = event => {
//       receiveVideoTag.srcObject = event.streams[0];
//   };
//   reveicePeerConnection.onicecandidate = event => {
//     if (event.candidate) {
//       socket.emit("candidate", id, event.candidate);
//     }
//   };
// });

// socket.on('candidate', (id, candidate) => {
//   reveicePeerConnection
//     .addIceCandidate(new RTCIceCandidate(candidate))
//     .catch(e => console.error(e));
// });

// socket.on('disconnectPeer', () => {
//   reveicePeerConnection.close();
// });

// window.onunload = window.onbeforeunload = () => {
//   socket.close();
// };

// socket.on("connect", () => {
//   socket.emit("watcher");
// });