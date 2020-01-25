// restful api 拿取必要資訊
// 1. userProfile
// 取得 cookie 裡面的 token
function getCookie(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for(var i = 0; i <ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

let currentUserDetail = {};

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
      console.log('獲取用戶資料有問題');
      window.location = '/'
    } else {
      const avatarImg = document.querySelector('#small_avatar img');
      avatarImg.src = validResponse.data.avatarUrl;
      currentUserDetail = validResponse.data;
      console.log('當前用戶', currentUserDetail);
    }
  })
}

// 2.  邀請用戶進到 channel 時獲取全部用戶資訊
let allUsers = [];

const invitePeopleTag = document.querySelector('#addRoomModal .enter_member_name');
invitePeopleTag.addEventListener('focus', function(e) {
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
buildChannelBtn.addEventListener('click', function() {
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
 function fetchChatRooms() {
    fetch('/rooms/getRooms')
    .then((response) => response.json())
    .catch((error) => console.log(error))
    .then((validResponse) => {
      const rooms = validResponse.data;
      for (let index = 0; index < rooms.length; index++) {
        const eachRoom = rooms[index];
        const roomListArea = document.querySelector('.side_pad .upper_section');
        const eachRoomTag = document.createElement('div');
        eachRoomTag.setAttribute('id', `channelId_${eachRoom.id}`)
        eachRoomTag.textContent = eachRoom.name;
        roomListArea.appendChild(eachRoomTag);
      }
    })
 } 

 fetchChatRooms();

// Socket.io 有關的 code
const socket = io.connect('ws://localhost:3000');
// 聊天室主區塊 Div
const chatFlowContent = document.getElementById('message_flow_area');
// 切換到的 Room
let currentSelectedRoom = {};
// 紀錄上一次切換的 Room (給一個永不成立的 room)
let lastChooseRoom = {
  roomId: -1,
  roomTitle: ''
};

const sidePadChannelSection = document.querySelector('.side_pad .upper_section');
sidePadChannelSection.addEventListener('click', function(event) {
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
    const chatContentArea = document.querySelector('#message_flow_area');
    chatContentArea.innerHTML = '';

    fetch(`/messages/getMessages?roomId=${validRoomId}`)    
    .then((response) => response.json())
    .catch((error) => console.log(error))
    .then((validResponse) => {
      // 這邊 api 拿到的是從新到舊的訊息，但 UI 介面應該要處理的是由舊到新的，所以這邊我們要反轉
      const chatMessageList = validResponse.data.reverse();
      for (let index = 0; index < chatMessageList.length; index++) {
        const eachMessage = chatMessageList[index];
        const { avatarUrl, name, messageContent } = eachMessage;
        showChatContent(avatarUrl, name, messageContent);
      }
    })

    // 切換房間時同時加入到 Room，同時把 userDetail 送上來，但如果切換的房間與上次不同，要變成類似離開該房間的效果
    console.log('roomDetail', currentSelectedRoom)
    console.log('lastChooseRoom', lastChooseRoom)
    if (currentSelectedRoom.roomId !== lastChooseRoom.roomId) {
      socket.emit('join', {
        roomInfo: currentSelectedRoom,
        userInfo: currentUserDetail
      }, (error) => {
        if (error) {
          alert(error)
          window.location ='/'
        }
      })

      socket.emit('leave', {
        lastChooseRoom: lastChooseRoom,
        userInfo: currentUserDetail
      }, (error) => {
        if (error) {
          alert(error)
          window.location ='/'
        }
      });
      lastChooseRoom.roomId = currentSelectedRoom.roomId;
      lastChooseRoom.roomTitle = currentSelectedRoom.roomTitle;
    }
  }
})

// 發送簡單訊息
const enterMessageInput = document.querySelector('#message_window');
const sendMessageBtn = document.querySelector('#send_btn');

sendMessageBtn.addEventListener('click', function() {
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
  const { avatarUrl, name } = dataFromServer.userInfo;
  showChatContent(avatarUrl, name, dataFromServer.messageContent);
})

//  顯示聊天室內容 UI
function showChatContent(avatarUrl, name, messageContent) {
  const eachMessageDiv = document.createElement('div');
  eachMessageDiv.classList.add('message_block');
    
  // 頭像
  const avatarImg = document.createElement('img');
  avatarImg.src = avatarUrl;
  eachMessageDiv.appendChild(avatarImg);
  // 名稱
  const userNameTag = document.createElement('p');
  userNameTag.textContent = name;
  // 訊息
  const messageMainContent = document.createElement('p');
  messageMainContent.textContent = messageContent;
  // 訊息跟名字包一起
  const nameAndMessageDiv = document.createElement('div');
  nameAndMessageDiv.classList.add('nameAndMessage');
  nameAndMessageDiv.appendChild(userNameTag);
  nameAndMessageDiv.appendChild(messageMainContent);
  eachMessageDiv.appendChild(nameAndMessageDiv);
  chatFlowContent.appendChild(eachMessageDiv);
}