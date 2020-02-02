// 聊天室主區塊 Div
const chatFlowContent = document.getElementById('message_flow_area');
chatFlowContent.innerHTML = '';
// 顯示歷史訊息
getChatHistory(currentSelectedRoom.roomId);

// 加入房間
socket.emit('join', {
  roomInfo: currentSelectedRoom,
  userInfo: currentUserDetail
}, (error) => {
  if (error) {
    alert(error)
    window.location = '/'
  }
})

// 切換房間相關邏輯
// 紀錄上一次切換的 Room (預設就是 general 這個 room)
let lastChooseRoom = currentSelectedRoom;

const sidePadChannelSection = document.querySelector('.side_pad .upper_section');
sidePadChannelSection.addEventListener('click', function (event) {
  if (event.target && event.target.nodeName.toUpperCase() === 'DIV') {
    const validRoomId = parseInt(event.target.getAttribute('id').replace('channelId_', ''));
    currentSelectedRoom = {
      roomId: validRoomId,
      roomTitle: event.target.textContent
    }
    // 改變上方 header UI
    const roomTitleTag = document.querySelector('#room_title h1');
    roomTitleTag.textContent = currentSelectedRoom.roomTitle;

    // 打 restful Api 獲取聊天室內容
    // 1. 先把當下的畫面清除掉避免畫面看到之前房間留下來的訊息
    chatFlowContent.innerHTML = '';
    getChatHistory(validRoomId);

    // 切換房間時同時加入到 Room，同時把 userDetail 送上來，但如果切換的房間與上次不同，要變成類似離開該房間的效果
    // defect 一樣是 非同步造成的
    console.log('currentRoomDetail', currentSelectedRoom.roomId, lastChooseRoom.roomTitle)
    console.log('lastChooseRoom', lastChooseRoom.roomId, lastChooseRoom.roomTitle)
    if (currentSelectedRoom.roomId !== lastChooseRoom.roomId) {
      // 切換房間要紀錄起來
      // 要有一支 api (未完成)
      fetch('/users/renewUserSelectedRoom', {
        method: 'PUT',
        body: JSON.stringify({
          userId: currentUserDetail.userId,
          roomId: currentSelectedRoom.roomId
        }),
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      })
        .then(response => response.json())
        .catch(error => console.log(error))
        .then((validResponse) => {
          if (validResponse.data) {
            // 更換房間事件
            socket.emit('changeRoom', {
              joinRoomInfo: currentSelectedRoom,
              userInfo: currentUserDetail,
              lastChooseRoom: lastChooseRoom
            }, function (finishedInfo) {
              lastChooseRoom.roomId = currentSelectedRoom.roomId;
              lastChooseRoom.roomTitle = currentSelectedRoom.roomTitle;
            })
          }
        })
    }
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
    messageTime: Date.now()
  });
})

// 接收 Server 端發過來的 message 事件
socket.on('message', (dataFromServer) => {
  const { roomId, roomTitle } = dataFromServer.roomDetail;
  console.log('房間資訊', roomId, roomTitle)
  const messageTime = dataFromServer.messageTime;
  const { avatarUrl, name, userId } = dataFromServer.userInfo;
  showChatContent(avatarUrl, name, dataFromServer.translateResults, userId, messageTime);
})

//  顯示聊天室內容 UI
function showChatContent(avatarUrl, name, translateResults, fromUserId, messageTime) {
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
  // 翻譯訊息
  for (let i = 0; i < translateResults.length; i++) {
    const eachTranslateMessage = translateResults[i];
    const eachTranslateTag = document.createElement('p');
    eachTranslateTag.textContent = eachTranslateMessage;
    messagesDiv.appendChild(eachTranslateTag);
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
  chatFlowContent.appendChild(eachMessageDiv);
  // 自動捲動到底部
  chatFlowContent.innerHTML = chatFlowContent.innerHTML.trim();
  let chatFlowArea = document.getElementById('message_flow_area');
  chatFlowArea.scrollTo(0, chatFlowContent.scrollHeight);
}

// 獲取聊天室歷史內容
function getChatHistory(selectedRoomId) {
  fetch(`/messages/getMessages?roomId=${selectedRoomId}`)
    .then((response) => response.json())
    .catch((error) => console.log(error))
    .then(async (validResponse) => {
      // 這邊 api 拿到的是從新到舊的訊息，但 UI 介面應該要處理的是由舊到新的，所以這邊我們要反轉
      const chatMessageList = validResponse.data.reverse();
      let translateMessagePromiseList = [];
      for (let index = 0; index < chatMessageList.length; index++) {
        const eachMessage = chatMessageList[index];
        const { avatarUrl, name, userId, messageContent, languageVersion, createdTime } = eachMessage;
        // 這邊要再做一支翻譯 api
        const languageList = Array.from(new Set(languageVersion.split(',')));
        // 順序會錯是因為這邊非同步的問題，不能保證前面一個已經做完了才做下一個
        translateMessagePromiseList.push(fetch('/messages/translateMessage', {
          method: 'POST',
          body: JSON.stringify({
            avatarUrl: avatarUrl,
            name: name,
            messageContent: messageContent,
            languageList: languageList,
            fromUserId: userId,
            createdTime: createdTime
          }),
          headers: new Headers({
            'Content-Type': 'application/json'
          })
        }))
      }
      Promise.all(translateMessagePromiseList)
        .then((responseResults) => {
          let jsonConvertList = [];
          for (let i = 0; i < responseResults.length; i++) {
            jsonConvertList.push(responseResults[i].json());
          }
          Promise.all(jsonConvertList)
            .then((convertResults) => {
              for (let i = 0; i < convertResults.length; i++) {
                const eachConverMessage = convertResults[i].data;
                showChatContent(eachConverMessage.messageUserAvatar,
                  eachConverMessage.messageUserName,
                  eachConverMessage.translationResults,
                  eachConverMessage.messageFromUser,
                  eachConverMessage.messageTime
                );
              }
            })
        })
    })
}