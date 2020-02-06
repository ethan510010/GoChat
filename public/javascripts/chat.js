// 聊天室主區塊 Div
const chatFlowContent = document.getElementById('message_flow_area');
chatFlowContent.addEventListener('scroll', function() {
  const mentionLine = document.querySelector('.new_message_mention_line');
  if (mentionLine) {
    // Get parent element properties
    const chatFlowContentTop = chatFlowContent.scrollTop;
    // Get new message mention line properties
    const mentionLineTop = mentionLine.offsetTop;
    // Check if in view
    let isTotalOutside = (mentionLineTop < chatFlowContentTop);
    if (isTotalOutside) {
      console.log('新訊息提示完全移出外面');
      // 移除新訊息提示
      chatFlowContent.removeChild(mentionLine);
    }
  }
})

// 加入房間
socket.emit('join', {
  roomInfo: currentSelectedRoom,
  userInfo: currentUserDetail
}, (joinInfo) => {
  if (joinInfo) {
    const roomId = joinInfo.roomInfo.roomId;
    const userId = joinInfo.userInfo.userId;
    socket.emit('getRoomHistory', {
      roomId: roomId,
      userId: userId
    })
  }
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
      lastChooseRoom: lastChooseRoom
    }, function (finishedInfo) {
      lastChooseRoom.roomId = currentSelectedRoom.roomId;
      lastChooseRoom.roomTitle = currentSelectedRoom.roomTitle;
      // 把提示新訊息的 UI 刪除掉
      const channelIdDiv = document.getElementById(`channelId_${currentSelectedRoom.roomId}`);
      const beRemovedNewMsgMentionTag = document.getElementById(`channelId_${currentSelectedRoom.roomId}`).lastChild;
      channelIdDiv.removeChild(beRemovedNewMsgMentionTag);
      // 切換完成後去抓取歷史訊息
      chatFlowContent.innerHTML = '';
      socket.emit('getRoomHistory', {
        roomId: validRoomId,
        userId: currentUserDetail.userId
      })
    })
  }
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
  // const { roomId, roomTitle } = dataFromServer.roomDetail;
  // console.log('房間資訊', roomId, roomTitle)
  const { messageTime, messageContent, messageType, messageId } = dataFromServer;
  const { avatarUrl, name, userId } = dataFromServer.userInfo;
  // 改成 socket 觸發
  socket.emit('translateMessage', {
    messageId: messageId,
    avatarUrl: avatarUrl,
    name: name,
    messageContent: messageContent,
    languageList: currentUserDetail.selectedLanguage,
    fromUserId: userId,
    createdTime: messageTime,
    messageType: messageType
  })
})

// 接收翻譯訊息並顯示出來
socket.on('saveTranslatedMessageFinish', (translatedInfo) => {
  // 把原始訊息、跟翻譯後的丟進去
  // 如果原始訊息跟翻譯後的結果完全一樣要過濾掉
  const { messageFromUser, messageUserName, messageUserAvatar, originalMessage, translatedWord, messageTime, messageType } = translatedInfo;
  const messageWords = Array.from(new Set([originalMessage, translatedWord]));
  // 開啟自動捲動到底部
  shouldAutoScrollToBottom = true;
  showChatContent(messageUserAvatar, messageUserName, messageWords, messageFromUser, messageTime, messageType);
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

// 接收歷史訊息
socket.on('showHistory', (historyMessages) => {
  // 因為 UI 越新在越底下
  const reverseMessages = historyMessages.reverse();
  for (let i = 0; i < reverseMessages.length; i++) {
    const historyMsg = reverseMessages[i];
    if (historyMsg.language === currentUserDetail.selectedLanguage) {
      let defaultAvatar = historyMsg.avatarUrl === '' ? '/images/defaultAvatar.png' : historyMsg.avatarUrl;
      if (historyMsg.messageType === 'image') {
        showChatContent(defaultAvatar, historyMsg.name, [historyMsg.messageContent], historyMsg.userId, historyMsg.createdTime, historyMsg.messageType);  
      } else if (historyMsg.messageType === 'text') {
        showChatContent(defaultAvatar, historyMsg.name, [historyMsg.messageContent, historyMsg.translatedContent], historyMsg.userId, historyMsg.createdTime, historyMsg.messageType);  
      }
    }
  }
})

//  顯示聊天室內容 UI
function showChatContent(avatarUrl, name, chatMsgResults, fromUserId, messageTime, messageType) {
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
  // 這邊一定是錯的，只是先測試
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
    chatFlowContent.appendChild(newMessageMentionLine); 
  }
  chatFlowContent.appendChild(eachMessageDiv);
  // 自動捲動到底部
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

// 捲動到特定元素
function scrollToElement(element, speed) {
  let rect=element.getBoundingClientRect();
    //获取元素相对窗口的top值，此处应加上窗口本身的偏移
    let top=window.pageYOffset+rect.top;
    let currentTop=0;
    let requestId;
    //采用requestAnimationFrame，平滑动画
    function step(timestamp) {
      currentTop+=speed;
      if(currentTop<=top){
        window.scrollTo(0,currentTop);
        requestId=window.requestAnimationFrame(step);
      }else{
        window.cancelAnimationFrame(requestId);
      }
    }
    window.requestAnimationFrame(step);
}