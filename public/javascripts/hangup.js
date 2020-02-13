const hangupCallBtn = document.getElementById('hangup');
hangupCallBtn.addEventListener('click', function() {
  // 代表是由發起視訊的人掛斷
  if (!receiveCallId) {
    const allCalls = Object.values(callConnections);
    console.log('掛斷的 connenctions', callConnections);
    for (let i = 0; i < allCalls.length; i++) {
      const call = allCalls[i];
      call.close();
    }
    callConnections = {};
  } else {
    // 代表是看到視訊的觸發掛斷的
    callConnections[receiveCallId].close();
    delete callConnections[receiveCallId];
  }
})