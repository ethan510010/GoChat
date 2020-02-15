// 聊天室主區塊 Div
const chatFlowContent = document.getElementById('message_flow_area');
chatFlowContent.addEventListener('scroll', function () {
  // Get parent element properties
  const chatFlowContentTop = chatFlowContent.scrollTop;
  // 180 大約是三筆訊息的大小
  if (chatFlowContentTop <= 180 && !scrollFinished) {
    currentScrollPage += 1;
    socket.emit('getRoomHistory', {
      roomId: currentSelectedRoom.roomId,
      userId: currentUserDetail.userId,
      userSelectedLanguge: currentUserDetail.selectedLanguage,
      page: currentScrollPage,
      changeRoomMode: false
    })
  }
  const mentionLine = document.querySelector('.new_message_mention_line');
  if (mentionLine) {
    // Get new message mention line properties
    const mentionLineTop = mentionLine.offsetTop;
    // Check if in view
    let isTotalOutside = (mentionLineTop < chatFlowContentTop);
    if (isTotalOutside) {
      console.log('新訊息提示完全移出外面');
      // 移除新訊息提示
      mentionLine.parentNode.removeChild(mentionLine);
    }
  }
})
// 紀錄捲動到的位置
let currentScrollPage = 0;
// 紀錄捲動是否結束
let scrollFinished = false;
// 加入房間
// 配合 WebRTC
const callBtn = document.getElementById('callVideo');
// create a peer connection with peer obj
let currentUserPeerId;
let peer = new Peer();
let connectionList = [];

peer.on('open', function () {
  document.getElementById('displayId').textContent = peer.id;
  // 每一個人專屬的 peerId
  currentUserPeerId = peer.id;
  console.log('my peerId', peer.id);
  socket.emit('join', {
    peerId: peer.id,
    roomInfo: currentSelectedRoom,
    userInfo: currentUserDetail
  }, (joinInfo) => {
    if (joinInfo) {
      const roomId = joinInfo.roomInfo.roomId;
      const userId = joinInfo.userInfo.userId;
      socket.emit('getRoomHistory', {
        roomId: roomId,
        userId: userId,
        userSelectedLanguge: joinInfo.userInfo.selectedLanguage,
        page: currentScrollPage,
        changeRoomMode: false
      })
      // 獲取歷史的 canvas
      socket.emit('getRoomCanvas', {
        roomId: roomId,
        userId: userId,
      })
    }
  })
})

let allConnectionPeersOfCurrentRoom = [];
socket.on('allPeersForRoom', (peersInfoFromServer) => {
  // 如果有重整就清空
  allConnectionPeersOfCurrentRoom = [];
  const { peersRoomPair } = peersInfoFromServer;
  console.log('總配對情形', peersRoomPair);
  console.log('當前用戶準備視訊所在房間', currentSelectedRoom)
  const currentRoomPeerPairs = peersRoomPair[currentSelectedRoom.roomId];
  for (let i = 0; i < currentRoomPeerPairs.length; i++) {
    const eachPeerOfCurrentRoom = currentRoomPeerPairs[i];
    allConnectionPeersOfCurrentRoom.push(eachPeerOfCurrentRoom.peerId);
  }
  console.log(`現在在房間${currentSelectedRoom.roomId}中所有的${allConnectionPeersOfCurrentRoom}`);
})

peer.on('connection', function (connection) {
  conn = connection;
  // 另外一段傳過來的
  peer_id = connection.peer;
  document.getElementById('connId').value = peer_id;
})

peer.on('error', function (error) {
  console.log(error);
  alert('an error occurred');
})

// 紀錄與發起者有建立 call 的
let callConnections = {};
// 視訊發起者要發起視訊
callBtn.addEventListener('click', function () {
  // 接收端如果正在看 remote 端的影片或是該房間的廣播影片還在播放是不可以按下連線的
  if (isWatchingRemoteVideo) {
    alert('You can not call before hanging up current call');
    return;
  }
  if (roomPlayingVideo) {
    alert('The rooms is still playing a video, Please try again after the current room call finished');
    return;
  }
  // 依序進行連線
  console.log('全部連線PeerId', allConnectionPeersOfCurrentRoom);
  socket.emit('broadcastVideo', {
    videoLauncherRoomId: currentSelectedRoom.roomId,
    launchVideoUser: currentUserDetail,
    launchPeerId: currentUserPeerId
  }, (getBroadCastVideo) => {
    // 這段 code 很重要
    // for (let i = 0; i < allConnectionPeersOfCurrentRoom.length; i++) {
    //   const eachPeerIdOfCurrentRoom = allConnectionPeersOfCurrentRoom[i];
    //   // 相當於按下 connect 按鈕
    //   if (eachPeerIdOfCurrentRoom) {
    //     if (eachPeerIdOfCurrentRoom !== currentUserPeerId) {
    //       console.log('目前用戶 peerId', currentUserPeerId);
    //       conn = peer.connect(eachPeerIdOfCurrentRoom)
    //       const currentConnection = peer.connect(eachPeerIdOfCurrentRoom);
    //       // 要 call 誰
    //       console.log('calling a peer ' + eachPeerIdOfCurrentRoom);
    //       // 我要 call 誰
    //       const call = peer.call(eachPeerIdOfCurrentRoom, window.localstream);
    //       console.log('the call', call);
    //       callConnections[call.connectionId] = call;
    //     } else {
    //       console.log('自己跟自己不用連')
    //     }
    //     // connectionList.push(currentConnection);
    //   } else {
    //     alert('error')
    //   }
    // }
  })
})
// 紀錄房間正在播放中，只有當視訊發起人關閉時這個開關才會變成 false，其他人才可以在該房間發起視訊
let roomPlayingVideo = false;
// 這邊是接收端的處理
socket.on('shouldOpenCallAlert', (dataFromServer) => {
  const { videoLauncher, launchVideoPeerId, videoLauncherRoomId } = dataFromServer;
  // 所有在房間的人都必須紀錄現在該房間正有視訊在播放
  roomPlayingVideo = true;
  // 視訊發起者本身不需要看到 alert 跳出
  if (currentUserPeerId !== launchVideoPeerId) {
    videoDisplayDiv.style.display = 'block';
    // const acceptCall = confirm(`Do you want to accept the call From ${videoLauncher.name}?`);
    showCustomConfirmDialog(`Do you want to accept the call From ${videoLauncher.name}?`)
    customDialogConfirmClicked(function() {
      console.log('目前全部的 peers', allConnectionPeersOfCurrentRoom);
      console.log('該 Peer Id 需要進行連線', currentUserPeerId);
      socket.emit('shouldBeConnectedPeerId', {
        launchVideoPeerId: launchVideoPeerId,
        shouldConnectedPeerId: currentUserPeerId,
        videoLauncherRoomId: videoLauncherRoomId
      });
    })
    customDialogCancelClicked(function() {
      // 把視訊視窗關掉
      videoDisplayDiv.style.display = 'none';
    });
  }
})

// 發起視訊端接收到的
socket.on('shouldBeConnectedPeerId', (dataFromServer) => {
  const { launchVideoPeerId, shouldConnectedPeerId, videoLauncherRoomId } = dataFromServer;
  // 代表是視訊發起者
  if (launchVideoPeerId === currentUserPeerId) {
    console.log('視訊發起者', peer);
    conn = peer.connect(shouldConnectedPeerId)
    const currentConnection = peer.connect(shouldConnectedPeerId);
    // 要 call 誰
    console.log('calling a peer ' + shouldConnectedPeerId);
    // 我要 call 誰
    const call = peer.call(shouldConnectedPeerId, window.localstream);
    console.log('the call', call);
    callConnections[call.connectionId] = call;
  }
})
// 接收端處理哪些是需要實際連線的
// click call (offer and answer is exchanged) 
let receiveCallId;
peer.on('call', function (call) {
  // let acceptCall = confirm('Do you want to accept the call?');
  // if (acceptCall) {
  call.answer(window.localstream);
  console.log('接收到 call')
  call.on('stream', function (stream) {
    window.peer_stream = stream
    // 接收 call 的人要存自己拿到的 call 的 id
    callConnections[call.connectionId] = call;
    receiveCallId = call.connectionId;
    recStream(stream, 'remoteVideo')
  })

  // 監聽 call 結束
  call.on('close', function () {
    // 這邊把全部的 call 都關掉
    console.log('call被移掉了');
    // 關閉視窗
    videoDisplayDiv.style.display = 'none';
  })
})
// socket.emit('join', {
//   roomInfo: currentSelectedRoom,
//   userInfo: currentUserDetail
// }, (joinInfo) => {
//   if (joinInfo) {
//     const roomId = joinInfo.roomInfo.roomId;
//     const userId = joinInfo.userInfo.userId;
//     socket.emit('getRoomHistory', {
//       roomId: roomId,
//       userId: userId,
//       userSelectedLanguge: joinInfo.userInfo.selectedLanguage,
//       page: currentScrollPage,
//       changeRoomMode: false
//     })
//     // 獲取歷史的 canvas
//     socket.emit('getRoomCanvas', {
//       roomId: roomId,
//       userId: userId,
//     })
//   }
// })

// 聊天內容是否需要自動捲到底部 (如果今天是新訊息通知切換過來的時候，不需要自動捲動到底部，只有正常聊天需要)
let shouldAutoScrollToBottom = true;
// 切換房間相關邏輯
// 紀錄上一次切換的 Room (預設就是 general 這個 room)
let lastChooseRoom = currentSelectedRoom;

const roomsAreaSection = document.querySelector('.side_pad .rooms');
roomsAreaSection.addEventListener('click', function (event) {
  let validRoomId = 0;
  let roomTitle = '';
  if (event.target.nodeName.toUpperCase() === 'DIV') {
    validRoomId = parseInt(event.target.getAttribute('id').replace('channelId_', ''));
    roomTitle = event.target.children[0].textContent;
  } else if (event.target.nodeName.toUpperCase() === 'P') {
    validRoomId = parseInt(event.target.parentElement.getAttribute('id').replace('channelId_', ''), 10);
    roomTitle = event.target.textContent;
  }
  // const validRoomId = parseInt(event.target.getAttribute('id').replace('channelId_', ''));
  currentSelectedRoom = {
    roomId: validRoomId,
    roomTitle: roomTitle
  }
  // 如果看影片的人播放中或是播放影片的人播放中，不能讓他切換
  if ((isWatchingRemoteVideo || isPlayingLocalVideo) && (currentSelectedRoom.roomId !== lastChooseRoom.roomId)) {
    alert('Please turn off video before change channel');
    return;
  }
  // 改變上方 header UI
  const roomTitleTag = document.querySelector('#room_title h1');
  roomTitleTag.textContent = currentSelectedRoom.roomTitle;
  // 切換房間時同時加入到 Room，同時把 userDetail 送上來，但如果切換的房間與上次不同，要變成類似離開該房間的效果
  // defect 一樣是 非同步造成的
  console.log('currentRoomDetail', currentSelectedRoom.roomId, lastChooseRoom.roomTitle)
  console.log('lastChooseRoom', lastChooseRoom.roomId, lastChooseRoom.roomTitle)
  if (currentSelectedRoom.roomId !== lastChooseRoom.roomId) {
    // 切換房間要紀錄起來
    // 要有一支 api
    // 更新房間
    // 更換房間事件
    socket.emit('changeRoom', {
      joinRoomInfo: currentSelectedRoom,
      userInfo: currentUserDetail,
      lastChooseRoom: lastChooseRoom,
      peerId: currentUserPeerId // 當前用戶的 peerId
    }, function (finishedInfo) {
      if (finishedInfo.acknowledged) {
        lastChooseRoom.roomId = currentSelectedRoom.roomId;
        lastChooseRoom.roomTitle = currentSelectedRoom.roomTitle;
        // 把提示新訊息的 UI 刪除掉
        const channelIdDiv = document.getElementById(`channelId_${currentSelectedRoom.roomId}`);
        const beRemovedNewMsgMentionTag = channelIdDiv.lastChild;
        if (beRemovedNewMsgMentionTag.nodeName.toUpperCase() === 'DIV' && beRemovedNewMsgMentionTag.className === 'messageMention') {
          channelIdDiv.removeChild(beRemovedNewMsgMentionTag);
        }
        // 切換完成後去抓取歷史訊息 ( 這時要把 currentScrollPage 歸 0)
        currentScrollPage = 0;
        scrollFinished = false;
        socket.emit('getRoomHistory', {
          roomId: validRoomId,
          userId: currentUserDetail.userId,
          userSelectedLanguge: currentUserDetail.selectedLanguage,
          page: currentScrollPage,
          changeRoomMode: true
        })
        // 切頁完成後去抓取 canvas 結果
        socket.emit('getRoomCanvas', {
          roomId: validRoomId,
          userId: currentUserDetail.userId,
        })
      }
    })
  }
})

socket.on('changeRoomPeersList', (peersInfoFromServer) => {
  // 切頁完成後，要重新處理每個房間的 peerIdList
  const { roomPeerIdList } = peersInfoFromServer;
  console.log('切換房間傳回來的 peer 配對', roomPeerIdList);
  allConnectionPeersOfCurrentRoom = roomPeerIdList[currentSelectedRoom.roomId].map((currentRoomEachPeer) => {
    return currentRoomEachPeer.peerId;
  })
  console.log('切換房間後重新取得的 peer 配對', allConnectionPeersOfCurrentRoom);
})
// 發送簡單訊息
const enterMessageInput = document.querySelector('#message_window');
const sendMessageBtn = document.querySelector('#send_btn');

sendMessageBtn.addEventListener('click', function () {
  socket.emit('clientMessage', {
    roomDetail: currentSelectedRoom,
    userInfo: currentUserDetail,
    messageContent: enterMessageInput.value,
    fileName: '',
    messageTime: Date.now(),
    messageType: 'text'
  });
})

// 發送圖片訊息
const sendImageBtn = document.getElementById('send_image');
sendImageBtn.addEventListener('change', function (e) {
  const fileData = e.target.files[0];
  let reader = new FileReader();
  reader.readAsDataURL(fileData);
  reader.onload = function () {
    socket.emit('clientMessage', {
      roomDetail: currentSelectedRoom,
      userInfo: currentUserDetail,
      messageContent: this.result,
      fileName: fileData.name,
      messageTime: Date.now(),
      messageType: 'image'
    })
  }
})

// 接收 Server 端發過來的 message 事件
socket.on('message', (dataFromServer) => {
  const { roomId, roomTitle } = dataFromServer.roomDetail;
  // console.log('房間資訊', roomId, roomTitle)
  const { messageTime, messageContent, messageType, messageId } = dataFromServer;
  const { avatarUrl, name, userId } = dataFromServer.userInfo;

  // 開啟自動捲動到底部
  shouldAutoScrollToBottom = true;
  const messageWords = Array.from(new Set([messageContent, dataFromServer[currentUserDetail.selectedLanguage]]));
  showChatContent(avatarUrl, name, messageWords, userId, messageTime, messageType, undefined);
})

// 接收有新訊息
let newMessageAndRoomPair = {};
let newMessageTimeAndRoomPair = {};
socket.on('newMessageMention', (newMessageInfo) => {
  const newMessageRoomId = newMessageInfo.newMessageRoomId;
  if (currentSelectedRoom.roomId !== newMessageRoomId) {
    // 加上提示標籤
    const roomsDiv = document.querySelector('.upper_section .rooms');
    console.log(roomsDiv.children)
    for (let i = 0; i < roomsDiv.children.length; i++) {
      const eachRoomDiv = roomsDiv.children[i];
      const eachRoomDivId = parseInt(eachRoomDiv.getAttribute('id').replace('channelId_', ''), 10);
      if (eachRoomDivId === newMessageRoomId) {
        // UI 加上提示
        let mentionTag = document.getElementById(`mentionId${newMessageRoomId}`);
        if (mentionTag && parseInt(mentionTag.getAttribute('id').replace('mentionId', ''), 10) === newMessageRoomId) {
          newMessageAndRoomPair[newMessageRoomId] += 1;
          mentionTag.textContent = `${newMessageAndRoomPair[newMessageRoomId]}`
        } else {
          // 第一筆新訊息
          const mentionDiv = document.createElement('div');
          newMessageAndRoomPair[newMessageRoomId] = 1;
          mentionDiv.textContent = `${newMessageAndRoomPair[newMessageRoomId]}`;
          mentionDiv.classList.add('messageMention');
          mentionDiv.id = `mentionId${newMessageRoomId}`;
          eachRoomDiv.appendChild(mentionDiv);
          newMessageTimeAndRoomPair[newMessageRoomId] = newMessageInfo.messageTime;
          console.log('第一筆新訊息的時間', newMessageTimeAndRoomPair)
          // 關閉自動滾動功能
          shouldAutoScrollToBottom = false;
        }
      }
    }
  }
})

// 接收歷史的 canvas 畫面
socket.on('showCanvas', (canvasHistory) => {
  context.clearRect(0, 0, canvas.width, canvas.height);
  console.log('歷史canvas', canvasHistory)
  // canvas context
  if (canvasHistory.canvasUrl !== '') {
    let img = new Image;
    img.crossOrigin = 'Anoymous';
    img.addEventListener('load', () => {
      context.drawImage(img, 0, 0);
    })
    img.src = canvasHistory.canvasUrl;
  }
})

// 接收歷史訊息
socket.on('showHistory', (historyInfo) => {
  if (historyInfo.changeRoomMode === true) {
    chatFlowContent.innerHTML = '';
  }
  // 因為 UI 越新在越底下
  const reverseMessages = historyInfo.messages.reverse();
  if (reverseMessages.length === 0) {
    scrollFinished = true;
  }
  const pageDiv = document.createElement('div');
  pageDiv.id = `currentPage${currentScrollPage}`;
  for (let i = 0; i < reverseMessages.length; i++) {
    const historyMsg = reverseMessages[i];
    let defaultAvatar = historyMsg.avatarUrl === '' ? '/images/defaultAvatar.png' : historyMsg.avatarUrl;
    if (historyMsg.messageType === 'image') {
      showChatContent(
        defaultAvatar,
        historyMsg.name,
        [historyMsg.messageContent],
        historyMsg.userId,
        historyMsg.createdTime,
        historyMsg.messageType,
        pageDiv);
    } else if (historyMsg.messageType === 'text') {
      showChatContent(
        defaultAvatar,
        historyMsg.name,
        Array.from(new Set([historyMsg.messageContent, historyMsg.translatedContent])),
        historyMsg.userId,
        historyMsg.createdTime,
        historyMsg.messageType,
        pageDiv);
    }
  }
  chatFlowContent.prepend(pageDiv);
  if (currentScrollPage === 0) {
    if (shouldAutoScrollToBottom) {
      chatFlowContent.innerHTML = chatFlowContent.innerHTML.trim();
      let chatFlowArea = document.getElementById('message_flow_area');
      chatFlowArea.scrollTo(0, chatFlowContent.scrollHeight);
    } else {
      const mentionLine = document.querySelector('.new_message_mention_line');
      if (mentionLine) {
        // mentionLine.scrollIntoView();
        // 如果新訊息非常多 new message 提示線會一直往上，如果非常多的話，最多就是在 chatFlowContent 的頂部
        const mentionLineTop = mentionLine.offsetTop;
        chatFlowContent.scrollTop = mentionLineTop;
      }
    }
  }
})

//  顯示聊天室內容 UI
function showChatContent(avatarUrl, name, chatMsgResults, fromUserId, messageTime, messageType, pageDiv) {
  const eachMessageDiv = document.createElement('div');
  eachMessageDiv.classList.add('message_block');
  if (currentUserDetail.userId === fromUserId) {
    eachMessageDiv.classList.add('messageHost');
  } else {
    eachMessageDiv.classList.add('messageReceiver');
  }
  // 把頭像跟姓名包一起
  const messageUserInfoDiv = document.createElement('div');
  messageUserInfoDiv.classList.add('messageUserInfo');
  // 頭像
  const avatarImg = document.createElement('img');
  avatarImg.classList.add('messageAvatar');
  avatarImg.src = avatarUrl;
  eachMessageDiv.appendChild(avatarImg);
  // 名稱
  const userNameTag = document.createElement('p');
  userNameTag.classList.add('userName');
  userNameTag.textContent = name;

  messageUserInfoDiv.appendChild(avatarImg);
  messageUserInfoDiv.appendChild(userNameTag);
  // 訊息區塊
  const messageOuterDiv = document.createElement('div');
  messageOuterDiv.classList.add('messageOuterBox');

  const messagesDiv = document.createElement('div');
  messagesDiv.classList.add('messageDetail');
  if (messageType === 'text') {
    // 翻譯訊息
    for (let i = 0; i < chatMsgResults.length; i++) {
      const eachTranslateMessage = chatMsgResults[i];
      const eachTranslateTag = document.createElement('p');
      eachTranslateTag.textContent = eachTranslateMessage;
      messagesDiv.appendChild(eachTranslateTag);
    }
  } else if (messageType === 'image') {
    const messageImageTag = document.createElement('img');
    messageImageTag.classList.add('imageMessage');
    messageImageTag.src = chatMsgResults[0];
    const downloadImageLink = document.createElement('a');
    downloadImageLink.href = chatMsgResults[0];
    downloadImageLink.appendChild(messageImageTag);
    messagesDiv.append(downloadImageLink);
  }
  messageOuterDiv.appendChild(messagesDiv);
  // 加上時間
  // 訊息時間
  const messageTimeTag = document.createElement('p');
  messageTimeTag.classList.add('messageTime');
  // timeStamp 變 date
  const messageDate = new Date(messageTime);
  if (messageDate.getMinutes() < 10) {
    messageTimeTag.textContent = `${messageDate.getHours()}:0${messageDate.getMinutes()}`;
  } else {
    messageTimeTag.textContent = `${messageDate.getHours()}:${messageDate.getMinutes()}`;
  }
  messageOuterDiv.appendChild(messageTimeTag);

  eachMessageDiv.appendChild(messageUserInfoDiv);
  eachMessageDiv.appendChild(messageOuterDiv);

  // 有 pageDiv 代表是歷史訊息，沒有代表是新傳遞的訊息
  if (pageDiv) {
    if (newMessageTimeAndRoomPair[currentSelectedRoom.roomId] === messageTime) {
      const newMessageMentionLine = document.createElement('div');
      newMessageMentionLine.classList.add('new_message_mention_line');
      const leftDecorationLine = document.createElement('div');
      leftDecorationLine.classList.add('left_decoration_line');
      const rightDecorationLine = document.createElement('div');
      rightDecorationLine.classList.add('right_decoration_line');
      const mentionP = document.createElement('p');
      mentionP.textContent = 'New message';
      newMessageMentionLine.appendChild(leftDecorationLine);
      newMessageMentionLine.appendChild(mentionP);
      newMessageMentionLine.appendChild(rightDecorationLine);
      pageDiv.appendChild(newMessageMentionLine, eachMessageDiv)
      // chatFlowContent.appendChild(newMessageMentionLine);
    }
    pageDiv.append(eachMessageDiv);
  } else {
    chatFlowContent.appendChild(eachMessageDiv);
    chatFlowContent.innerHTML = chatFlowContent.innerHTML.trim();
    let chatFlowArea = document.getElementById('message_flow_area');
    chatFlowArea.scrollTo(0, chatFlowContent.scrollHeight);
  }
}