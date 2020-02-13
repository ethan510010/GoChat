// let RTCSessionDescription = window.mozRTCSessionDescription
//   || window.webkitRTCSessionDescription || window.RTCSessionDescription;
// let RTCIceCandidate = window.mozRTCIceCandidate || window.webkitRTCIceCandidate
//   || window.RTCIceCandidate;

// video 區塊
const videoDisplayDiv = document.querySelector('.videoPopup');

const launchVideoBtn = document.querySelector('.lower_section .launchVideo');
launchVideoBtn.addEventListener('click', async function () {
  videoDisplayDiv.style.display = 'block';
})

// 啟動視訊按鈕
const startVideoBtn = document.querySelector('.video_button_area .call');
startVideoBtn.addEventListener('click', function () {
  startVideo();
})

// 轉換視窗按鈕
let cameraMode = 'screen';
// const changeModeBtn = document.querySelector('.video_button_area .changeMode');
// changeModeBtn.addEventListener('click', function () {
//   if (!navigator.mediaDevices ||
//     !navigator.mediaDevices.getUserMedia) {

//     console.log('getUserMedia is not supported!');
//     return;
//   } else {
//     const constraints = {
//       video: {
//         width: 320,
//         height: 240,
//       },
//       // audio : {
//       //   echocancellation: true,
//       // } 
//       audio: false
//     }

//     // switch (cameraMode) {
//     //   case 'screen':
//     //     cameraMode = 'user';
//     //     navigator.mediaDevices.getDisplayMedia(constraints)
//     // 	  .then(gotMediaStream)
//     //     .catch(handleError);
//     //     break;
//     //   case 'user':
//     //     cameraMode = 'screen';
//     //     avigator.mediaDevices.getUserMedia(constraints)
//     // 	  .then(gotMediaStream)
//     //     .catch(handleError);
//     //     break
//     // }
//     // // 獲取本機視訊
//     navigator.mediaDevices.getUserMedia(constraints)
//       .then(gotMediaStream)
//       .catch(handleError);
//   }
// })

// get the video and display it with permission
function startVideo() {
  if (!navigator.mediaDevices ||
    !navigator.mediaDevices.getUserMedia) {

    console.log('getUserMedia is not supported!');
    return;
  } else {
    const constraints = {
      video: true,
      audio: {
        echocancellation: true,
      }
    }

    // 獲取本機視訊
    navigator.mediaDevices.getDisplayMedia(constraints)
      .then(gotMediaStream)
      .catch(handleError);
  }
}

function handleError(err) {
  console.log('getUserMedia error:', err);
}

function gotMediaStream(stream) {
  window.localstream = stream;
  recStream(stream, 'localVideo')
}
// 處理 stream
// 播放者是否仍在播放中
let isPlayingLocalVideo = false;
// 接收者是否正在看影片中
let isWatchingRemoteVideo = false;

function recStream(stream, elemid) {
  const mainAreaTag = document.querySelector('.videoPopup .main_area');
  const localVideoTag = document.getElementById('localVideo');
  const remoteVideoTag = document.getElementById('remoteVideo');
  switch (elemid) {
    case 'localVideo':
      if (remoteVideoTag) {
        mainAreaTag.removeChild(remoteVideoTag);
        localVideoTag.style.height = 'calc(100% - 40px)';
        localVideoTag.srcObject = stream;
        // 代表廣播者已經開啟視訊了
        isPlayingLocalVideo = true;
      }
      break;
    case 'remoteVideo':
      if (localVideoTag) {
        remoteVideoTag.style.height = 'calc(100% - 40px)';
        mainAreaTag.removeChild(localVideoTag);
        remoteVideoTag.srcObject = stream;  
        isWatchingRemoteVideo = true;
      }
      break;
  }
  window.peer_stream = stream;
}