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

let currentUserId = null;

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
      console.log('email', validResponse.data.email);
      console.log('name', validResponse.data.name);
      console.log('當前UserId', validResponse.data.userId);
      currentUserId = validResponse.data.userId;
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
      // const dataListTag = document.createElement('dataList');
      // dataListTag.setAttribute('id', 'members');
      // for (let index = 0; index < users.length; index++) {
      //   const userInfo = users[index];
      //   const optionTag = document.createElement('option');
      //   optionTag.value = userInfo.name;
      //   optionTag.classList.add(`userId${userInfo.id}`)
      //   dataListTag.appendChild(optionTag);
      // }
      // inviteMembersTag.appendChild(dataListTag);
      
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
  let userIdList = [currentUserId];
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
      const roomTitleTag = document.createElement('p');
      roomTitleTag.textContent = channelName;
      const newCreatedRoomTag = document.createElement('div');
      newCreatedRoomTag.setAttribute('id', `channelId_${validResponse.data.channelId}`)
      newCreatedRoomTag.appendChild(roomTitleTag);
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
        const roomTitleTag = document.createElement('p');
        roomTitleTag.textContent = eachRoom.name;
        const newCreatedRoomTag = document.createElement('div');
        newCreatedRoomTag.setAttribute('id', `channelId_${eachRoom.id}`)
        newCreatedRoomTag.appendChild(roomTitleTag);
        roomListArea.appendChild(newCreatedRoomTag);
      }
    })
 } 

 fetchChatRooms();