const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const launchVideoBtn = document.querySelector('.lower_section .launchVideo');
// create a peer connection with peer obj
let currentUserPeerId;
// var peer = new Peer();
let peer = new Peer();

launchVideoBtn.addEventListener('click', async function () {
  try {
    // 等待啟動 video
    startVideo({
      success: function(stream) {
        window.localstream = stream;
        recStream(stream, 'localVideo')
      },
      error: function(err) {
        alert('cannot access')
      }
    });

  } catch (err) {
    console.log(err);
  }
})

// get the video and display it with permission
function startVideo(callbacks) {
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
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

peer.on('open', function() {
  document.getElementById('displayId').textContent = peer.id;
  // 每一個人專屬的 peerId
  currentUserPeerId = peer.id;
  console.log('peerId', peer.id);
  // 藉由 socket 傳送過來
  socket.emit('sendPeerId', {
    peerId: peer.id,
    userId: currentUserDetail.userId,
    roomId: currentSelectedRoom.roomId
  });
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
// document.getElementById('conn_button').addEventListener('click', function () {
//   peer_id = document.getElementById('connId').value;

//   if (peer_id) {
//     conn = peer.connect(peer_id)
//   } else {
//     alert('error')
//   }
// })
document.getElementById('callVideo').addEventListener('click', function () {
  // 依序進行連線
  console.log('全部連線', otherConnectionPeers);
  for (let i = 0; i < otherConnectionPeers.length; i++) {
    const otherPeerId = otherConnectionPeers[i];
    // 相當於按下 connect 按鈕
    if (otherPeerId) {
      conn = peer.connect(otherPeerId)
    } else {
      alert('error')
    }
    // 要 call 誰
    console.log('calling a peer ' + otherPeerId);
    // 我要 call 誰
    const call = peer.call(otherPeerId, window.localstream);
    // 監聽到對方的影像回來
    call.on('stream', function (stream) {
      // window.peer_stream = stream;
      recStream(stream, 'remoteVideo')
    })
  }
})

// click call (offer and answer is exchanged) 
peer.on('call', function (call) {
  let acceptCall = confirm('Do you want to accept')
  if (acceptCall) {
    call.answer(window.localstream);

    call.on('stream', function (stream) {
      window.peer_stream = stream

      recStream(stream, 'remoteVideo')
    })

    call.on('close', function () {
      alert('The call has behind');
    })
  } else {
    console.log('call denied')
  }
})

// ask to call
// document.getElementById('callVideo').addEventListener('click', function (e) {
//   console.log('calling a peer' + peer_id);

//   // 我要 call 誰
//   const call = peer.call(peer_id, window.localstream);
//   // 監聽到對方的影像回來
//   call.on('stream', function (stream) {
//     window.peer_stream = stream;
//     recStream(stream, 'remoteVideo')
//   })
// })

// socket
let otherConnectionPeers = [];
socket.on('allPeersForRoom', (peersInfoFromServer) => {
  const { roomId, allPeersForRoom }  = peersInfoFromServer;
  console.log(`房間${roomId}中有${allPeersForRoom}`);
  for (let i = 0; i < allPeersForRoom.length; i++) {
    const eachPeerId = allPeersForRoom[i];
    if (eachPeerId !== currentUserPeerId) {
      otherConnectionPeers.push(eachPeerId);
    }
  }
  otherConnectionPeers = Array.from(new Set(otherConnectionPeers));
  console.log('最終其他人的', otherConnectionPeers);
})