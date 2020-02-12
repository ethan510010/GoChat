// const launchVideoTag = document.getElementById('launchVideo');
// const peerConnections = {};
// let launcherPC;
// const launcherConfig = {
//   iceServers: [
//     {
//       urls: ['stun:stun.l.google.com:19302']
//     }
//   ]
// };

// const launchVideoBtn = document.querySelector('.lower_section .launchVideo');
// launchVideoBtn.addEventListener('click', function(event) {
//   startVideo();
// })

// function startVideo() {
//   if (window.stream) {
//     window.stream.getTracks().forEach(track => {
//       track.stop();
//     });
//   }
//   const constraints = {
//     video: {
//       width: {
//         max: 320
//       },
//       height: {
//         max: 240
//       }
//     },
//     audio: false
//   }
//   return navigator.mediaDevices
//     .getDisplayMedia(constraints)
//     .then((stream) => {
//       window.stream = stream;
//       launchVideoTag.srcObject = stream;
//       socket.emit('broadcastVideo');
//     })
//     .catch((error) => {
//       console.log(error)
//     })
// }

// socket.on('watcher', id => {
//   launcherPC = new RTCPeerConnection(launcherConfig);
//   peerConnections[id] = launcherPC; 

//   let stream = launchVideoTag.srcObject;
//   stream.getTracks().forEach((track) => {
//     launcherPC.addTrack(track, stream);
//   })

//   launcherPC.onicecandidate = (event) => {
//     if (event.candidate) {
//       socket.emit('candidate', id, event.candidate);
//     }
//   }

//   launcherPC
//   .createOffer()
//   .then((sdp) => {
//     launcherPC.setLocalDescription(sdp)
//   }) 
//   .then(() => {
//     socket.emit('offer', id, launcherPC.localDescription);
//   })
// })

// socket.on('candidate', (id, candidate) => {
//   launcherPC.addIceCandidate(new RTCIceCandidate(candidate));
//   // peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
// })

// socket.on('answer', (id, description) => {
//   launcherPC.setRemoteDescription(description);
//   // peerConnections[id].setRemoteDescription(description)
// })

// socket.on('disconnectPeer', id => {
//   launcherPC.close()
//   // peerConnections[id].close();
//   // delete launcherPC;
//   // delete peerConnections[id];
// });

// window.onunload = window.onbeforeunload = () => {
//   socket.close();
// };

// 測試2
// let localStream;
// let localPeerConnection;
// let remotePeerConnection;
// const localVideo = document.getElementById('launchVideo');
// const remoteVideo = document.getElementById('receiverVideo');
// let launcherPC;
// const launcherConfig = {
//   iceServers: [
//     {
//       urls: ['stun:stun.l.google.com:19302']
//     }
//   ]
// };

// const mediaConstraints = {
//   "mandatory": {
//     "OfferToReceiveAudio": true,
//     "OfferToReceiveVideo": true
//   }
// };

// const launchVideoBtn = document.querySelector('.lower_section .launchVideo');
// launchVideoBtn.addEventListener('click', function (event) {
//   startVideo();
// })

// function startVideo() {
//   navigator.getUserMedia = navigator.getUserMedia ||
//     navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
//   const constraints = {
//     video: {
//       width: {
//         max: 320
//       },
//       height: {
//         max: 240
//       }
//     },
//     audio: false
//   }
//   navigator.getUserMedia(constraints, gotStream,
//     function (error) {
//       trace('navigator.getUserMedia error: ', error);
//     });
// }

// function gotStream(stream) {
//   localVideo.srcObject = stream;
//   localStream = stream;
// }

// const callVideoBtn = document.querySelector('.lower_section .callVideo');
// callVideoBtn.addEventListener('click', function (event) {
//   // getPeerConnection(); //建立RTCPeerConnection 的函式(fireFox 瀏覽器另外處理)
//   localPeerConnection = new RTCPeerConnection(launcherConfig);
//   remotePeerConnection = new RTCPeerConnection(launcherConfig);
//   remotePeerConnection.onaddstream = gotRemoteStream; //產生串流
//   localPeerConnection.addStream(localStream);

//   //準備訊息交換的訊息
//   localPeerConnection.createOffer(function (sdp) {
//     localPeerConnection.setLocalDescription(sdp, function () {
//       socket.emit('offer', { sdp: sdp, remotePeerConnection: remotePeerConnection });
//     }, Error);
//   }, function () {
//     console.log('create offer error.');
//   }, mediaConstraints);
// })

// function gotRemoteStream(event) {
//   remoteVideo.srcObject = event.stream;
// }

// // 建立 ice ，準備連線的前置作業
// socket.on('offer', function (data) {
//   if (!remotePeerConnection) {
//     remotePeerConnection = data.remotePC;
//   }
//   remotePeerConnection.onicecandidate = function (e) {
//     if (!!e.candidate) {
//       socket.emit('ice', { candidate: e.candidate });  // 發送出ice 訊息… 等待socket回傳ice訊息
//     }
//   };
//   var offer = new RTCSessionDescription(data.sdp);  // 預備要交換的訊息
//   remotePeerConnection.setRemoteDescription(offer, function () {
//     // 遠端電腦接收offer訊息後，要回傳answer訊息，並開始進始多媒體的傳輸作業
//     remotePeerConnection.createAnswer(function (sdp) {
//       remotePeerConnection.setLocalDescription(sdp, function () {
//         socket.emit('answer', { sdp: sdp }); //送出socket 的answer 等待，socket 回傳answer 訊息
//       }, function (e) {
//         console.log('set local description error: ' + e);
//       });
//     }, function (e) {
//       console.log('create answer error: ' + e);
//     }, mediaConstraints);
//   }, function (e) {
//     console.log('set remote description error: ' + e);
//   });
// });


// // 接收遠端電腦回傳的answer 訊息
// socket.on('answer', function (data) {
//   localPeerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));  //準備多媒體傳輸通道
// });

// // 接收回傳ice 訊息，將自己本地端的ICE 訊息回傳
// socket.on('ice', function (data) {
//   localPeerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
// });

// function getPeerConnection() {
//   localPeerConnection = new RTCPeerConnection(launcherConfig);
//   remotePeerConnection = new RTCPeerConnection(launcherConfig);
//   console.log(localPeerConnection, remotePeerConnection)
//   // if(navigator.userAgent.indexOf("Chrome") != -1 )
//   // {
//   //     localPeerConnection = new webkitRTCPeerConnection(null);
//   //     remotePeerConnection = new webkitRTCPeerConnection(null);
//   // }             
//   // else if(navigator.userAgent.indexOf("Firefox") != -1 )
//   // {
//   //     localPeerConnection = new mozRTCPeerConnection(null);
//   //     remotePeerConnection = new mozRTCPeerConnection(null);
//   // }
// }

// 測試3
const localVideo = document.getElementById('launchVideo');
const remoteVideo = document.getElementById('receiverVideo');



const launchVideoBtn = document.querySelector('.lower_section .launchVideo');
launchVideoBtn.addEventListener('click', function (event) {
  startVideo({
    success: function(stream) {
      window.localstream = stream;
      recStream(stream, 'launchVideo')
    },
    error: function(err) {
      alert('cannot access')
    }
  });
})

// get the video and display it with permission
function startVideo(callbacks) {
  navigator.getUserMedia = navigator.getUserMedia ||
  navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
  const constraints = {
    video: {
      width: {
        max: 320
      },
      height: {
        max: 240
      }
    },
    audio: false
  }
  navigator.getUserMedia(constraints, callbacks.success, callbacks.error);
}

function recStream(stream, elemid) {
  const video = document.getElementById(elemid);
  video.srcObject = stream;

  window.peer_stream = stream;
}

// create a peer connection with peer obj
var peer = new Peer();
peer.on('open', function() {
  document.getElementById('displayId').textContent = peer.id;
  console.log('peerId', peer.id)
})
// click connection = expose ice info
let conn;
let peer_id;

// 這一端監聽到其他端的連線會觸發的
peer.on('connection', function(connection) {
  conn = connection;
  // 另外一段傳過來的
  peer_id = connection.peer;
  document.getElementById('connId').value = peer_id;
})

peer.on('error', function(error) {
  alert('an error occurred')
})

// A 端按下連線，會觸發 B 端的 on('connection)
document.getElementById('conn_button').addEventListener('click', function () {
  peer_id = document.getElementById('connId').value;

  if (peer_id) {
    conn = peer.connect(peer_id)
  } else {
    alert('error')
  }
})
// click call (offer and answer is exchanged) 
peer.on('call', function (call) {
  let acceptCall = confirm('Do you want to accept')
  if (acceptCall) {
    call.answer(window.localstream);

    call.on('stream', function (stream) {
      window.peer_stream = stream

      recStream(stream, 'receiverVideo')
    })

    call.on('close', function () {
      alert('The call has behind');
    })
  } else {
    console.log('call denied')
  }
})

// ask to call
document.getElementById('callVideo').addEventListener('click', function (e) {
  console.log('calling a peer' + peer_id);

  // 我要 call 誰
  const call = peer.call(peer_id, window.localstream);
  // 監聽到對方的影像回來
  call.on('stream', function (stream) {
    window.peer_stream = stream;
    recStream(stream, 'receiverVideo')
  })
})