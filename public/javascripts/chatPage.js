// 聊天室主區塊 Div
const chatFlowContent = document.getElementById('message_flow_area');
// Token
const accessToken = getCookie('access_token');
if (!accessToken || accessToken === '') {
  window.location = '/';
} else {
  fetch('/users/profile', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
    .then((response) => response.json())
    .catch((err) => console.log(err))
    .then((validResponse) => {
      if (typeof validResponse.data === 'string') {
        window.location = '/'
      } else {
        const avatarImg = document.querySelector('#small_avatar img');
        // 如果用戶現在沒有自己上傳大頭貼因為 DB 是空的，所以我們就先給他預設的
        const uiAvatar = validResponse.data.avatarUrl === '' ? '/images/defaultAvatar.png' : validResponse.data.avatarUrl; 
        avatarImg.src = uiAvatar;
        validResponse.data.avatarUrl = uiAvatar;
        // 設定當前用戶
        currentUserDetail = validResponse.data;
        console.log('當前用戶', currentUserDetail);
        // 用戶當前選到的房間也是由使用者的 profile 拿到
        currentSelectedRoom.roomId = validResponse.data.lastSelectedRoomId;
        currentSelectedRoom.roomTitle = validResponse.data.lastSelectedRoomTitle;
        console.log('用戶目前所在房間', currentSelectedRoom);
        const roomTitleTag = document.querySelector('#room_title h1');
        roomTitleTag.textContent = currentSelectedRoom.roomTitle;
        // 顯示訊息
        chatFlowContent.innerHTML = '';
        getChatHistory(currentSelectedRoom.roomId);
        // 顯示房間列表
        fetchChatRooms(currentUserDetail.userId);
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
      }
    })
}

// 2.  邀請用戶進到 channel 時獲取全部用戶資訊
let allUsers = [];

const invitePeopleTag = document.querySelector('#addRoomModal .enter_member_name');
invitePeopleTag.addEventListener('focus', function (e) {
  // 打 api 獲取用戶列表
  fetch('/users/listUsers', {})
    .then((response) => response.json())
    .catch((err) => console.log(err))
    .then((validResponse) => {
      if (typeof validResponse.data === 'string') {
        console.log('獲取全部用戶資料有問題')
      } else {
        // const inviteMembersTag = document.querySelector('.modal-content');
        const users = validResponse.data;
        allUsers = users;
      }
    })
})

//  3. 創建 channel 及 選好的用戶
const buildChannelBtn = document.querySelector('.modal-content .confirm_button');
buildChannelBtn.addEventListener('click', function () {
  let selectedMembers = [];
  const channelName = document.querySelector('#addRoomModal .enter_channel_name').value;
  // 這邊邏輯之後會配合邀請成員的 UI 修改跟著變動
  const memberListStr = document.querySelector('.modal-content .enter_member_name').value;
  const memberList = memberListStr.split(',');
  for (let index = 0; index < allUsers.length; index++) {
    const user = allUsers[index];
    for (let i = 0; i < memberList.length; i++) {
      const inputMember = memberList[i];
      if (inputMember === user.name) {
        selectedMembers.push(user);
      }
    }
  }
  // 把當前用戶的 id 先放進去
  let userIdList = [currentUserDetail.userId];
  for (let i = 0; i < selectedMembers.length; i++) {
    const userDetail = selectedMembers[i];
    userIdList.push(userDetail.userId);
  }
  // 打 api 創建 Room
  fetch('/rooms/createRoom', {
    method: 'POST',
    body: JSON.stringify({
      channelName: channelName,
      userIdList: userIdList
    }),
    headers: new Headers({
      'Content-Type': 'application/json'
    })
  }).then((response) => response.json())
    .catch((error) => console.log(error))
    .then((validResponse) => {
      if (typeof validResponse.data === 'string') {
        alert('新增房間失敗，請稍後再試');
      } else {
        // 新增成功這邊要讓前端顯示房間
        const modal = document.getElementById('addRoomModal');
        modal.style.display = 'none';
        // 新增 Room 到畫面上
        const roomListArea = document.querySelector('.side_pad .upper_section');
        const newCreatedRoomTag = document.createElement('div');
        newCreatedRoomTag.textContent = channelName;
        newCreatedRoomTag.setAttribute('id', `channelId_${validResponse.data.channelId}`)
        roomListArea.appendChild(newCreatedRoomTag);
      }
    })
})

// 4. 獲取房間列表
function fetchChatRooms(userId) {
  fetch(`/rooms/getRooms?userId=${userId}`)
    .then((response) => response.json())
    .catch((error) => console.log(error))
    .then((validResponse) => {
      const rooms = validResponse.data;
      for (let index = 0; index < rooms.length; index++) {
        const eachRoom = rooms[index];
        const roomListArea = document.querySelector('.side_pad .upper_section');
        const eachRoomTag = document.createElement('div');
        eachRoomTag.setAttribute('id', `channelId_${eachRoom.id}`)
        eachRoomTag.classList.add('room_title');
        eachRoomTag.textContent = eachRoom.name;
        roomListArea.appendChild(eachRoomTag);
      }
    })
}

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

      // 更換房間事件
      socket.emit('changeRoom', {
        joinRoomInfo: currentSelectedRoom,
        userInfo: currentUserDetail,
        lastChooseRoom: lastChooseRoom
      }, function(finishedInfo) {
        lastChooseRoom.roomId = currentSelectedRoom.roomId;
        lastChooseRoom.roomTitle = currentSelectedRoom.roomTitle;
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
  const { avatarUrl, name, userId } = dataFromServer.userInfo;
  showChatContent(avatarUrl, name, dataFromServer.translateResults, userId);
})

//  顯示聊天室內容 UI
function showChatContent(avatarUrl, name, translateResults, fromUserId) {
  const eachMessageDiv = document.createElement('div');
  eachMessageDiv.classList.add('message_block');
  if (currentUserDetail.userId === fromUserId) {
    eachMessageDiv.classList.add('messageHost');
  } else {
    eachMessageDiv.classList.add('messageReceiver');
  }
  // 頭像
  const avatarImg = document.createElement('img');
  avatarImg.src = avatarUrl;
  eachMessageDiv.appendChild(avatarImg);
  // 名稱
  const userNameTag = document.createElement('p');
  userNameTag.classList.add('userName');
  userNameTag.textContent = name;
  // 訊息跟名字包一起
  const nameAndMessageDiv = document.createElement('div');
  nameAndMessageDiv.classList.add('nameAndMessage');
  nameAndMessageDiv.appendChild(userNameTag);
  // nameAndMessageDiv.appendChild(messageMainContent);
  // 翻譯訊息
  for (let i = 0; i < translateResults.length; i++) {
    const eachTranslateMessage = translateResults[i];
    const eachTranslateTag = document.createElement('p');
    eachTranslateTag.textContent = eachTranslateMessage;
    nameAndMessageDiv.appendChild(eachTranslateTag);
  }
  eachMessageDiv.appendChild(nameAndMessageDiv);
  chatFlowContent.appendChild(eachMessageDiv);
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
        const { avatarUrl, name, userId, messageContent, languageVersion } = eachMessage;
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
            fromUserId: userId
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
                const eachConverMessage = convertResults[i];
                showChatContent(eachConverMessage.data.messageUserAvatar, eachConverMessage.data.messageUserName, eachConverMessage.data.translationResults, eachConverMessage.data.messageFromUser)
              }
            })
        })
    })
}