const hangupCallBtn = document.getElementById('hangup');
hangupCallBtn.addEventListener('click', function () {
  // 代表是由發起視訊的人 (視訊發起者) 掛斷
  if (!receiveCallId) {
    const allCalls = Object.values(callConnections);
    console.log('掛斷的 connenctions', callConnections);
    for (let i = 0; i < allCalls.length; i++) {
      const call = allCalls[i];
      call.close();
    }
    callConnections = {};
    // 代表現在發起端沒有在播放影片了
    isPlayingLocalVideo = false;
    // 把視訊畫面關掉
    videoDisplayDiv.style.display = 'none';
    // 通知在房間的所有人此房間的視訊已經結束
    socket.emit('roomPlayingVideoOver', {
      roomId: currentSelectedRoom.roomId,
      roomPlayingVideo: false
    });
    // 移除
  } else {
    // 代表是看到視訊 (視訊接收者) 的觸發掛斷的
    if (callConnections[receiveCallId]) {
      callConnections[receiveCallId].close();
      delete callConnections[receiveCallId];
    }
    // 代表已經沒有在看遠端視訊了
    isWatchingRemoteVideo = false;
    videoDisplayDiv.style.display = 'none';
  }
  resetVideo();
})

// 因為視訊發起方掛斷電話，才會得到 roomPlayingVideo over 的結果，所以 socket.on 寫在這邊
socket.on('getRoomPlayingVideoOver', (overInfo) => {
  if (overInfo) {
    const { finisedVideoRoomId, roomPlayingVideo } = overInfo;
    // receiveId 重置
    receiveCallId = null;
    roomPlayingVideoRecords[finisedVideoRoomId] = roomPlayingVideo;
  }
})

function resetVideo() {
  const mainAreaTag = document.querySelector('.videoPopup .main_area');
  const localVideoTag = document.getElementById('localVideo');
  const remoteVideoTag = document.getElementById('remoteVideo');
  if (localVideoTag) {
    mainAreaTag.removeChild(localVideoTag);
  }
  if (remoteVideoTag) {
    mainAreaTag.removeChild(remoteVideoTag);
  }
  const resetLocalVideoTag = document.createElement('video');
  resetLocalVideoTag.setAttribute('id', 'localVideo');
  resetLocalVideoTag.autoplay = true;
  resetLocalVideoTag.playsinline = true;
  resetLocalVideoTag.style.height = 'calc((100% - 40px)/2)';
  const resetRemoteVideoTag = document.createElement('video');
  resetRemoteVideoTag.setAttribute('id', 'remoteVideo');
  resetRemoteVideoTag.autoplay = true;
  resetRemoteVideoTag.playsinline = true;
  resetRemoteVideoTag.style.height = 'calc((100% - 40px)/2)';
  mainAreaTag.prepend(resetRemoteVideoTag);
  mainAreaTag.prepend(resetLocalVideoTag);
}