const launchVideoTag = document.getElementById('launchVideo');
const peerConnections = {};
let launcherPC;
const launcherConfig = {
  iceServers: [
    {
      urls: ['stun:stun.l.google.com:19302']
    }
  ]
};

const launchVideoBtn = document.querySelector('.lower_section .launchVideo');
launchVideoBtn.addEventListener('click', function(event) {
  startVideo();
})

function startVideo() {
  if (window.stream) {
    window.stream.getTracks().forEach(track => {
      track.stop();
    });
  }
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
  return navigator.mediaDevices
    .getDisplayMedia(constraints)
    .then((stream) => {
      window.stream = stream;
      launchVideoTag.srcObject = stream;
      socket.emit('broadcastVideo');
    })
    .catch((error) => {
      console.log(error)
    })
}

socket.on('watcher', id => {
  launcherPC = new RTCPeerConnection(launcherConfig);
  peerConnections[id] = launcherPC; 

  let stream = launchVideoTag.srcObject;
  stream.getTracks().forEach((track) => {
    launcherPC.addTrack(track, stream);
  })

  launcherPC.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('candidate', id, event.candidate);
    }
  }

  launcherPC
  .createOffer()
  .then((sdp) => {
    launcherPC.setLocalDescription(sdp)
  }) 
  .then(() => {
    socket.emit('offer', id, launcherPC.localDescription);
  })
})

socket.on('candidate', (id, candidate) => {
  launcherPC.addIceCandidate(new RTCIceCandidate(candidate));
  // peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
})

socket.on('answer', (id, description) => {
  launcherPC.setRemoteDescription(description);
  // peerConnections[id].setRemoteDescription(description)
})

socket.on('disconnectPeer', id => {
  launcherPC.close()
  // peerConnections[id].close();
  // delete launcherPC;
  // delete peerConnections[id];
});

window.onunload = window.onbeforeunload = () => {
  socket.close();
};