const modal = document.getElementById('addRoomModal');

const createRoomBtn = document.querySelector('.room_header .add_room');
let allUsers = [];

fetch('/users/listUsers')
  .then((response) => response.json())
  .catch((err) => console.log(err))
  .then((validResponse) => {
    if (validResponse.data) {
      allUsers = validResponse.data;
    }
  })
// 獲取 close button
var closePopupSpan = document.getElementsByClassName("close")[0];

createRoomBtn.addEventListener('click',function(event) {
  // 把搜尋會員弄回原本的樣子
  const selected = document.querySelector('.selected');
  selected.innerHTML = '';
  // optionsContainer.innerHTML = '';
  // for (let index = 0; index < allUsers.length; index++) {
  //   const userData = allUsers[index];
  //   // 1. option div
  //   const userOption = document.createElement('div');
  //   userOption.classList.add('option');
  //   // 2. input ratio
  //   const userRatioInput = document.createElement('input');
  //   userRatioInput.type = 'radio';
  //   userRatioInput.classList.add('radio');
  //   userRatioInput.name = 'user';
  //   userRatioInput.id = `userId_${userData.userId}`;
  //   // 3. label
  //   const optionLabel = document.createElement('label');
  //   optionLabel.setAttribute('for', `userId_${userData.userId}`);
  //   optionLabel.textContent = userData.name;
  //   userOption.appendChild(userRatioInput);
  //   userOption.appendChild(optionLabel);
  //   optionsContainer.appendChild(userOption); 
  //   optionsContainer.classList.remove('active');
  // }
  if (!document.querySelector('.selected p')) {
    const pTag = document.createElement('p');
    pTag.textContent = 'select member';
    selected.appendChild(pTag);  
  }

  modal.style.display = 'block';
})

// popup 關閉按鈕
closePopupSpan.addEventListener('click', function() {
  modal.style.display = 'none';
})

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = 'none';
  }
}

// 跳出選單
const selected = document.querySelector('.selected');
const optionsContainer = document.querySelector('.options-container');
const optionsList = document.querySelectorAll('.option');
const searchBox = document.querySelector('.search-box input');
// 被邀請進 channel 的用戶
let beInvitedMembers = [];

selected.addEventListener('click', function (e) {
  // 移除原本的提示 p tag，並加上一個可編輯的 div 作為裝飾用
  if (document.querySelector('.selected p')) {
    document.querySelector('.selected p').textContent = '';
    selected.removeChild(document.querySelector('.selected p'));
  }
  // 為了 tags input 這邊要加上可以刪除標籤的 delegate
  switch (e.target.nodeName.toUpperCase()) {
    case 'IMG':
      const beRemovedNameTag = e.target.parentElement;
      const beRemovedUserId = beRemovedNameTag.classList[1].replace('userId', '');
      const beRemovedIndex = beInvitedMembers.findIndex((userId) => {
        return userId === beRemovedUserId;
      });
      beInvitedMembers.splice(beRemovedIndex, 1);
      selected.removeChild(beRemovedNameTag);
      // 需要把下拉選單該用戶加回來，否則會看不到該用戶
      // 1. option div
      const userOption = document.createElement('div');
      userOption.classList.add('option');
      // 2. input ratio
      const userRatioInput = document.createElement('input');
      userRatioInput.type = 'radio';
      userRatioInput.classList.add('radio');
      userRatioInput.name = 'user';
      userRatioInput.id = `userId_${beRemovedUserId}`;
      // 3. label
      const optionLabel = document.createElement('label');
      optionLabel.setAttribute('for', `userId_${beRemovedUserId}`);
      optionLabel.textContent = beRemovedNameTag.textContent;
      userOption.appendChild(userRatioInput);
      userOption.appendChild(optionLabel);
      optionsContainer.appendChild(userOption);
      e.preventDefault();
      return;
    case 'SPAN':
      e.preventDefault();
      return;
    case 'DIV':
      if (e.target.getAttribute('class') === 'nameTag') {
        e.preventDefault();
        return;  
      }
    // default:
    //   const decorationInput = document.createElement('input');
    //   decorationInput.classList.add('decorationEdit');
    //   decorationInput.placeholder = 'name';
    //   selected.appendChild(decorationInput);
  }
  optionsContainer.classList.toggle('active');
  searchBox.value = '';
  filterList('');
  if (optionsContainer.classList.contains('active')) {
    searchBox.focus();
  }
})

optionsContainer.addEventListener('click', function(e) {
  let selectedUIUser = '';
  let selectedUserIdValue = '';
  switch (e.target.nodeName.toUpperCase()) {
    case 'DIV':
      const innerLabel = e.target.querySelector('label');
      selectedUserIdValue = innerLabel.getAttribute('for').replace('userId_', '');
      selectedUIUser = innerLabel.innerHTML;
      break;
    case 'LABEL':
      selectedUserIdValue = e.target.getAttribute('for').replace('userId_', '');
      selectedUIUser = e.target.innerHTML;
      e.preventDefault();
      break;
  }
  // 先把裝飾用的 input 移掉
  // selected.removeChild(document.querySelector('.selected .decorationEdit'));
  // 產生有 X 的姓名 div
  const nameTag = document.createElement('div');
  nameTag.classList.add('nameTag');
  nameTag.classList.add(`userId${selectedUserIdValue}`);
  // 記錄到要加進 channel 的用戶
  beInvitedMembers.push(selectedUserIdValue);
  // 同時也要把下拉選單該用戶先移除掉，避免重複選取
  const allUserOptions = document.querySelectorAll('.option');
  for (let i = 0; i < allUserOptions.length; i++) {
    const eachOption = allUserOptions[i];
    if (eachOption.children[0].nodeName.toUpperCase() === 'INPUT') {
      const userIdValue =  eachOption.children[0].getAttribute('id').replace('userId_', '');
      if (userIdValue === selectedUserIdValue) {
        optionsContainer.removeChild(eachOption);
      }
    }
  }
  const nameSpan = document.createElement('span');
  nameSpan.textContent = selectedUIUser;
  const removeNameImg = document.createElement('img');
  removeNameImg.src = '/images/remove.png';
  nameTag.appendChild(nameSpan);
  nameTag.appendChild(removeNameImg);
  selected.appendChild(nameTag);
  // selected.textContent = selectedUILanguage;
  optionsContainer.classList.remove('active');
})

searchBox.addEventListener('keyup', function (e) {
  filterList(e.target.value);
})
// 過濾用戶
const filterList = (searchTerm) => {
  searchTerm = searchTerm.toLowerCase();
  optionsList.forEach(option => {
    let labelContent = option.firstElementChild.nextElementSibling.textContent.toLowerCase();
    if (labelContent.indexOf(searchTerm) !== -1) {
      option.style.display = 'block';
    } else {
      option.style.display = 'none';
    }
  });
};
//  3. 創建 channel 及 選好的用戶
const buildChannelBtn = document.querySelector('.modal-content .confirm_button');
buildChannelBtn.addEventListener('click', function () {
  const channelName = document.querySelector('#addRoomModal .enter_channel_name').value;
  // 把當前用戶的 id 先放進去
  let userIdList = [currentUserDetail.userId];
  for (let i = 0; i < beInvitedMembers.length; i++) {
    userIdList.push(beInvitedMembers[i]);
  }
  // 打 api 創建 Room
  // 先確定有沒有 room 的名稱重複了
  if (allRooms.includes(channelName)) {
    alert(`${channelName}已經存在了，請輸入其他的`);
    return;
  } 
  if (channelName === '') {
    alert('請輸入 Channel 名字');
    return;
  }
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
        newCreatedRoomTag.setAttribute('id', `channelId_${validResponse.data.channelId}`);
        newCreatedRoomTag.classList.add('room_title');
        roomListArea.appendChild(newCreatedRoomTag);
      }
    })
})