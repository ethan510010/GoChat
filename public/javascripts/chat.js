// 動畫區塊
const loader = document.getElementById('loader');
// 把一開始就選到的房間
const chatFlowContent = document.getElementById('message_flow_area');
chatFlowContent.addEventListener('scroll', function () {
  // Get parent element properties
  const chatFlowContentTop = chatFlowContent.scrollTop;
  // 240 大約是四筆訊息的大小
  if (chatFlowContentTop <= 240 && !scrollFinished) {
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
  const { peersRoomPair, roomUsersPair } = peersInfoFromServer;
  console.log('總配對情形', peersRoomPair);
  console.log('當前用戶準備視訊所在房間', currentSelectedRoom)
  const currentRoomPeerPairs = peersRoomPair[currentSelectedRoom.roomId];
  for (let i = 0; i < currentRoomPeerPairs.length; i++) {
    const eachPeerOfCurrentRoom = currentRoomPeerPairs[i];
    allConnectionPeersOfCurrentRoom.push(eachPeerOfCurrentRoom.peerId);
  }
  console.log(`現在在房間${currentSelectedRoom.roomId}中所有的${allConnectionPeersOfCurrentRoom}`);
  showOnlineMemberUI(roomUsersPair, usersOfRoom);
})

peer.on('connection', function (connection) {
  // 另外一段傳過來的
  document.getElementById('connId').value = connection.peer;
})

peer.on('error', function (error) {
  console.log(error);
  // showCustomAlert('an error occurred');
})

// 紀錄與發起者有建立 call 的
let callConnections = {};
// 視訊發起者要發起視訊
callBtn.addEventListener('click', function () {
  // 接收端如果正在看 remote 端的影片或是該房間的廣播影片還在播放是不可以按下連線的
  if (isWatchingRemoteVideo) {
    showCustomAlert('You can not call before hanging up current call');
    return;
  }
  if (roomPlayingVideoRecords[currentSelectedRoom.roomId]) {
    showCustomAlert('The rooms is still playing a video, Please try again after the current room call finished');
    return;
  }
  // 依序進行連線
  console.log('全部連線PeerId', allConnectionPeersOfCurrentRoom);
  socket.emit('broadcastVideo', {
    videoLauncherRoomId: currentSelectedRoom.roomId,
    launchVideoUser: currentUserDetail,
    launchPeerId: currentUserPeerId
  })
})
// 紀錄房間正在播放中，只有當視訊發起人關閉時這個開關才會變成 false，其他人才可以在該房間發起視訊
let roomPlayingVideoRecords = {};
// 這邊是接收端的處理
socket.on('shouldOpenCallAlert', (dataFromServer) => {
  const { videoLauncher, launchVideoPeerId, videoLauncherRoomId } = dataFromServer;
  // 所有在房間的人都必須紀錄現在該房間正有視訊在播放
  roomPlayingVideoRecords[videoLauncherRoomId] = true;
  // 視訊發起者本身不需要看到 alert 跳出
  if (currentUserPeerId !== launchVideoPeerId) {
    videoDisplayDiv.style.display = 'block';
    showCustomConfirmDialog(`Do you want to accept the call From ${videoLauncher.name}?`)
    customDialogConfirmClicked(async function () {
      console.log('目前全部的 peers', allConnectionPeersOfCurrentRoom);
      console.log('要看視訊的 PeerId', currentUserPeerId);
      await sleep(500);
      socket.emit('shouldBeConnectedPeerId', {
        launchVideoPeerId: launchVideoPeerId,
        shouldConnectedPeerId: currentUserPeerId,
        videoLauncherRoomId: videoLauncherRoomId
      });
    })
    customDialogCancelClicked(function () {
      // 把視訊視窗關掉
      videoDisplayDiv.style.display = 'none';
    });
  }
})

// 發起視訊端接收到的
socket.on('shouldBeConnectedPeerId', async (dataFromServer) => {
  const { launchVideoPeerId, shouldConnectedPeerId } = dataFromServer;
  // 代表是視訊發起者
  if (launchVideoPeerId === currentUserPeerId) {
    console.log('視訊發起者', peer);
    await sleep(500);
    peer.connect(shouldConnectedPeerId);
    // 要 call 誰
    await sleep(500);
    console.log('calling a peer ' + shouldConnectedPeerId);
    // 我要 call 誰
    console.log(window.localstream);
    const call = peer.call(shouldConnectedPeerId, window.localstream);
    console.log('the call', call);
    callConnections[call.connectionId] = call;
  }
})
// 接收端處理哪些是需要實際連線的
// click call (offer and answer is exchanged) 
let receiveCallId;
peer.on('call', function (call) {
  console.log('windowLocalStream', window.localstream);
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
    // peer.disconnect();
    // 關閉視窗
    videoDisplayDiv.style.display = 'none';
  })
})

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
    const beSelectedRoomDiv = event.target;
    validRoomId = parseInt(beSelectedRoomDiv.getAttribute('id').replace('channelId_', ''));
    roomTitle = event.target.children[1].textContent;
    // 把舊的 room 的選到的裝飾 UI class 移除，加到新選擇的 
    const lastSelectedRoomDiv = document.getElementById(`channelId_${lastChooseRoom.roomId}`);
    lastSelectedRoomDiv.classList.remove('selectedRoomUI');
    beSelectedRoomDiv.classList.add('selectedRoomUI');
  } else if (event.target.nodeName.toUpperCase() === 'P') {
    const beSelectedRoomDiv = event.target.parentElement;
    validRoomId = parseInt(beSelectedRoomDiv.getAttribute('id').replace('channelId_', ''), 10);
    roomTitle = event.target.textContent;
    // 把舊的 room 的選到的裝飾 UI class 移除，加到新選擇的 
    const lastSelectedRoomDiv = document.getElementById(`channelId_${lastChooseRoom.roomId}`);
    if (lastSelectedRoomDiv) {
      lastSelectedRoomDiv.classList.remove('selectedRoomUI');
      beSelectedRoomDiv.classList.add('selectedRoomUI');  
    }
  }
  currentSelectedRoom = {
    roomId: validRoomId,
    roomTitle: roomTitle
  }
  // 如果看影片的人播放中或是播放影片的人播放中，不能讓他切換
  if ((isWatchingRemoteVideo || isPlayingLocalVideo) && (currentSelectedRoom.roomId !== lastChooseRoom.roomId)) {
    showCustomAlert('Please turn off video before change channel');
    return;
  }
  // 改變上方 header UI
  const roomTitleTag = document.querySelector('#room_title p');
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
    loader.style.display = 'block';
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
        socket.emit('getUsersOfRoom', validRoomId);
      }
    })
  }
})

socket.on('changeRoomPeersList', (peersInfoFromServer) => {
  // 切頁完成後，要重新處理每個房間的 peerIdList
  const { roomPeerIdList, roomUsersPair } = peersInfoFromServer;
  console.log('切換房間傳回來的 peer 配對', roomPeerIdList);
  allConnectionPeersOfCurrentRoom = roomPeerIdList[currentSelectedRoom.roomId].map((currentRoomEachPeer) => {
    return currentRoomEachPeer.peerId;
  })
  console.log('切換房間後重新取得的 peer 配對', allConnectionPeersOfCurrentRoom);
  // 切頁完成後比對在線上的用戶
  showOnlineMemberUI(roomUsersPair, usersOfRoom);
})
// 發送簡單訊息
const enterMessageInput = document.querySelector('#message_window');
const sendMessageBtn = document.querySelector('#send_btn');

enterMessageInput.addEventListener('keypress', function(e) {
  if (e.keyCode === 13) {
    e.preventDefault();
    sendMessageBtn.click();
   }
})

sendMessageBtn.addEventListener('click', function () {
  sendMessageBtn.disabled = true;
  if (enterMessageInput.value === '' || /^\s+$/gi.test(enterMessageInput.value)) {
    sendMessageBtn.disabled = false;
    return;
  }
  sendMessagageLoadingDiv('textMessage');
  socket.emit('clientMessage', {
    roomDetail: currentSelectedRoom,
    userInfo: currentUserDetail,
    messageContent: enterMessageInput.value,
    fileName: '',
    messageTime: Date.now(),
    messageType: 'text'
  }, (acknowledged) => {
    if (acknowledged.inputFinished) {
      //  清空輸入框
      sendMessageBtn.disabled = false;
      enterMessageInput.value = '';
    }
  });
})

// 發送圖片訊息
const sendImageBtn = document.getElementById('send_image');
sendImageBtn.addEventListener('change', function (e) {
  const fileData = e.target.files[0];
  let reader = new FileReader();
  reader.readAsDataURL(fileData);
  sendMessagageLoadingDiv('imageMessage');
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
  // 移除掉 fakeDev
  removeFakeLoadingDiv();
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

// 接收現有房間有哪些用戶
socket.on('showUsersOfRoom', (usersInRoomDetail) => {
  const { usersOfRoom, roomUsersPair } = usersInRoomDetail;
  showMembersOfCurrentRoom(usersOfRoom);
  showOnlineMemberUI(roomUsersPair, usersOfRoom);
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
  loader.style.display = 'none';
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

// clear members in roomUI and show users of currentSelectedRoom 
function showMembersOfCurrentRoom(usersInRoom) {
  usersOfRoom = usersInRoom;
  const onlineMembersArea = document.getElementById('online_members');
  onlineMembersArea.innerHTML = '';
  usersInRoom.forEach((user) => {
    const userDiv = document.createElement('div');
    userDiv.classList.add('room_member');
    userDiv.setAttribute('id', `roomMember_${user.userId}`);
    const smallCircle = document.createElement('div');
    smallCircle.classList.add('small_circle');
    const userName = document.createElement('p');
    userName.textContent = user.name;
    userDiv.appendChild(smallCircle);
    userDiv.appendChild(userName);
    onlineMembersArea.appendChild(userDiv);
  })
}
// 連線 UI 調整
function showOnlineMemberUI(roomUsersPair, usersOfRoom) {
  // 處理現在誰在線上
  let hashObj = {};
  for (let i = 0; i < usersOfRoom.length; i++) {
    hashObj[usersOfRoom[i].userId] = false;
  }
  for (let i = 0; i < roomUsersPair[currentSelectedRoom.roomId].length; i++) {
    hashObj[roomUsersPair[currentSelectedRoom.roomId][i].userId] = true;
  }
  const membersRegionTag = document.getElementById('online_members');
  membersRegionTag.childNodes.forEach((eachNode) => {
    if (eachNode.nodeName.toUpperCase() === 'DIV') {
      const userId = eachNode.id.replace('roomMember_', '');
      if (hashObj[userId]) {
        eachNode.classList.add('online_member_status');
      } else {
        if (eachNode.classList.contains('online_member_status')) {
          eachNode.classList.remove('online_member_status');
        }
      }
    }
  })
}

// 發送訊息時產生假的 div，作為等待動畫
function sendMessagageLoadingDiv(messageType) {
  const fakeDiv = document.createElement('div');
  fakeDiv.classList.add('message_block');
  fakeDiv.classList.add('messageHost');
  // fakeDiv.style.background = '#FFF';
  // 把頭像跟姓名包一起
  const messageUserInfoDiv = document.createElement('div');
  messageUserInfoDiv.classList.add('messageUserInfo');
  // 頭像
  const avatarImg = document.createElement('img');
  avatarImg.classList.add('messageAvatar');
  avatarImg.src = currentUserDetail.avatarUrl === '' ? '/images/defaultAvatar.png' : currentUserDetail.avatarUrl;
  fakeDiv.appendChild(avatarImg);
  // 名稱
  const userNameTag = document.createElement('p');
  userNameTag.classList.add('userName');
  userNameTag.textContent = currentUserDetail.name;

  messageUserInfoDiv.appendChild(avatarImg);
  messageUserInfoDiv.appendChild(userNameTag);

  fakeDiv.appendChild(messageUserInfoDiv);

  // loading 及其動畫
  if (messageType === 'textMessage') {
    const fakeLoading = document.createElement('div');
    fakeLoading.classList.add('spinner');
  
    const bounceOne = document.createElement('div');
    bounceOne.classList.add('bounceOne');
    const bounceTwo = document.createElement('div');
    bounceTwo.classList.add('bounceTwo');
    const bounceThree = document.createElement('div');
    bounceThree.classList.add('bounceThree');
    fakeLoading.appendChild(bounceOne);
    fakeLoading.appendChild(bounceTwo);
    fakeLoading.appendChild(bounceThree);
    fakeDiv.appendChild(fakeLoading);  
  } else if (messageType === 'imageMessage') {
    const outerBox = document.createElement('div');
    outerBox.classList.add('loading_outer_box');
    const mainLoadingDiv = document.createElement('div');
    mainLoadingDiv.classList.add('lds-default');
    mainLoadingDiv.innerHTML = '<div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>';
    outerBox.appendChild(mainLoadingDiv); 
    fakeDiv.appendChild(outerBox);
  }

  fakeDiv.setAttribute('id', 'loadingTranslation');
  chatFlowContent.appendChild(fakeDiv);
  chatFlowContent.innerHTML = chatFlowContent.innerHTML.trim();
  chatFlowContent.scrollTo(0, chatFlowContent.scrollHeight);
}

// 等到訊息回來把假的 div 移除掉
function removeFakeLoadingDiv() {
  if (document.getElementById('loadingTranslation')) {
    chatFlowContent.removeChild(document.getElementById('loadingTranslation'));
  }
}

// 如果斷線自動重連
// socket.on('disconnect', () => {
//   console.log('socket 斷線，自動重連');
//   socket.connect();
//   console.log('socket 重新連線');
// });