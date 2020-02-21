const modal = document.getElementById('addRoomModal');
// 功能 DOM
let optionsList;
const selected = document.querySelector('.selected');
const optionsContainer = document.querySelector('.options-container');
const searchBox = document.querySelector('.search-box input');
// 建立房間的按鈕
const createRoomBtn = document.querySelector('.room_header .add_room');
// 用來分辨是要新增房間還是更新房間用戶
let updateOrCreateRoomType = 'createRoom';

// 被邀請進 channel 的用戶
let beInvitedMembers = [];

// 獲取 close button
const closePopupSpan = document.getElementsByClassName('close')[0];

function resetModalup(mode) {
  modal.style.display = 'block';
  optionsContainer.classList.remove('active');
  beInvitedMembers = [];
  updateOrCreateRoomType = mode;

  // 把搜尋會員弄回原本的樣子
  const selected = document.querySelector('.selected');
  selected.innerHTML = '';
  // 會員下拉選單重置
  optionsContainer.innerHTML = '';
  for (let i = 0; i < allUsers.length; i++) {
    const eachUser = allUsers[i];
    const eachOption = document.createElement('div');
    eachOption.classList.add('option');
    eachOption.setAttribute('id', `option_${eachUser.userId}`);
    const radioUserTag = document.createElement('input');
    radioUserTag.type = 'radio';
    radioUserTag.classList.add('radio');
    radioUserTag.setAttribute('id', `userId_${eachUser.userId}`);
    radioUserTag.name = 'user';
    const userLabel = document.createElement('label');
    userLabel.setAttribute('for', `userId_${eachUser.userId}`);
    userLabel.textContent = `${eachUser.userName}`;
    eachOption.appendChild(radioUserTag);
    eachOption.appendChild(userLabel);
    optionsContainer.appendChild(eachOption);
  }
  if (!document.querySelector('.selected p')) {
    const pTag = document.createElement('p');
    pTag.textContent = 'select member';
    selected.appendChild(pTag);
  }
  shouldHideChannelInput(updateOrCreateRoomType);
}

createRoomBtn.addEventListener('click', function (event) {
  resetModalup('createRoom');
  // modal.style.display = 'block';
  // optionsContainer.classList.remove('active');
  // beInvitedMembers = [];
  // updateOrCreateRoomType = 'createRoom';
  // // 把搜尋會員弄回原本的樣子
  // const selected = document.querySelector('.selected');
  // selected.innerHTML = '';
  // // 會員下拉選單重置
  // optionsContainer.innerHTML = '';
  // for (let i = 0; i < allUsers.length; i++) {
  //   const eachUser = allUsers[i];
  //   const eachOption = document.createElement('div');
  //   eachOption.classList.add('option');
  //   eachOption.setAttribute('id', `option_${eachUser.userId}`);
  //   const radioUserTag = document.createElement('input');
  //   radioUserTag.type = 'radio';
  //   radioUserTag.classList.add('radio');
  //   radioUserTag.setAttribute('id', `userId_${eachUser.userId}`);
  //   radioUserTag.name = 'user';
  //   const userLabel = document.createElement('label');
  //   userLabel.setAttribute('for', `userId_${eachUser.userId}`);
  //   userLabel.textContent = `${eachUser.userName}`;
  //   eachOption.appendChild(radioUserTag);
  //   eachOption.appendChild(userLabel);
  //   optionsContainer.appendChild(eachOption);
  // }
  // if (!document.querySelector('.selected p')) {
  //   const pTag = document.createElement('p');
  //   pTag.textContent = 'select member';
  //   selected.appendChild(pTag);
  // }
  // shouldHideChannelInput(updateOrCreateRoomType);
})

// popup 關閉按鈕
closePopupSpan.addEventListener('click', function () {
  modal.style.display = 'none';
})

// 裡面的 channel input 及 channel name 提示是否要隱藏 (如果是從設定按鈕按的就必須隱藏，如果是 Create channel 按的就不用)
const shouldHideChannelInput = (updateOrCreateRoomType) => {
  let displayType = '';
  let title = '';
  switch (updateOrCreateRoomType) {
    case 'createRoom':
      displayType = 'block';
      title = 'Create a channel';
      break;
    case 'updateRoom':
      displayType = 'none';
      title = `Add People to channel ${currentSelectedRoom.roomTitle}`;
      break;
  }

  document.querySelector('.title_area h3').textContent = title;
  document.querySelector('.enter_people_name_mention').style.display = displayType;
  document.querySelector('.enter_channel_name_mention').style.display = displayType;
  document.querySelector('.enter_channel_name').style.display = displayType;
  document.querySelector('.enter_channel_name').value = '';
}
// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = 'none';
  }
}

// 跳出選單
selected.addEventListener('click', function (e) {
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
      // 全部都移光了，必須把提示 p tag 加回來
      if (beInvitedMembers.length === 0) {
        const pTag = document.createElement('p');
        pTag.textContent = 'select member';
        selected.appendChild(pTag);
      }
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
  } 
  // 把新抓到的 options 存起來
  optionsList = document.querySelectorAll('.option');
  optionsContainer.classList.toggle('active');
  searchBox.value = '';
  filterList('');
  if (optionsContainer.classList.contains('active')) {
    searchBox.focus();
  }
})

optionsContainer.addEventListener('click', function (e) {
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
  beInvitedMembers.push(parseInt(selectedUserIdValue, 10));
  // 同時也要把下拉選單該用戶先移除掉，避免重複選取
  const allUserOptions = document.querySelectorAll('.options-container .option');
  for (let i = 0; i < allUserOptions.length; i++) {
    const eachOption = allUserOptions[i];
    if (eachOption.children[0].nodeName.toUpperCase() === 'INPUT') {
      const userIdValue = eachOption.children[0].getAttribute('id').replace('userId_', '');
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
  // 移除原本的提示 p tag
  if (document.querySelector('.selected p')) {
    selected.removeChild(document.querySelector('.selected p'));
  }
  optionsContainer.classList.remove('active');
})

searchBox.addEventListener('keyup', function (e) {
  filterList(e.target.value);
})
// 過濾用戶
function filterList(searchTerm) {
  searchTerm = searchTerm.toLowerCase();
  for (let i = 0; i < optionsList.length; i++) {
    const option = optionsList[i];
    const userName = option.lastChild.textContent.toLowerCase();
    if (userName.indexOf(searchTerm) !== -1) {
      option.style.display = 'block';
    } else {
      option.style.display = 'none';
    }
  }
};
//  3. 創建 channel 及 選好的用戶
const buildChannelBtn = document.querySelector('.modal-content .confirm_button');
buildChannelBtn.addEventListener('click', function () {
  // 把當前用戶的 id 先放進去
  const channelName = document.querySelector('.enter_channel_name').value; 
  let userIdList = [currentUserDetail.userId];
  let newAddedMembers = [];
  for (let i = 0; i < beInvitedMembers.length; i++) {
    userIdList.push(beInvitedMembers[i]);
    newAddedMembers.push(beInvitedMembers[i]);
  }
  // 如果是從新增房間輸入的，才會有上面這個值，如果是直接從設定加人的就是更新
  if (updateOrCreateRoomType === 'updateRoom') {
    // console.log('被新增進房間的用戶', userIdList.splice(0, 1))
    // 如果是更新，必須把第一個用戶 id 拿掉
    fetch('/rooms/updateRoomMember', {
      method: 'PUT',
      body: JSON.stringify({
        roomId: currentSelectedRoom.roomId,
        userIdList: newAddedMembers
      }),
      headers: new Headers({
        'Content-type': 'application/json'
      })
    }).then((response) => response.json())
    .catch((error) => console.log(error))
    .then((validResponse) => {
      if (validResponse.data) {
        const modal = document.getElementById('addRoomModal');
        modal.style.display = 'none';
      }
    })
  } else {
    // 打 api 創建 Room
    // 先確定有沒有 room 的名稱重複了
    if (allRooms.includes(channelName)) {
      showCustomAlert(`${channelName}已經存在了，請輸入其他的`);
      return;
    }
    if (channelName === '') {
      showCustomAlert(`請輸入 Channel 名字`)
      return;
    }
    if(/^\s+$/gi.test(channelName)){
      showCustomAlert('Channel 名字不能全為空白');
      return;
    }
    fetch('/rooms/createRoom', {
      method: 'POST',
      body: JSON.stringify({
        channelName: channelName,
        namespaceId: currentNamespaceId,
        userIdList: userIdList
      }),
      headers: new Headers({
        'Content-Type': 'application/json'
      })
    }).then((response) => response.json())
      .catch((error) => console.log(error))
      .then((validResponse) => {
        if (typeof validResponse.data === 'string') {
          showCustomAlert('新增房間失敗，請稍後再試');
        } else {
          // 新增成功這邊要讓前端顯示房間
          const modal = document.getElementById('addRoomModal');
          modal.style.display = 'none';
          // 新增 Room 到畫面上
          const roomListArea = document.querySelector('.side_pad .upper_section .rooms');
          const newCreatedRoomTag = document.createElement('div');
          const newCreatedRoomTitleTag = document.createElement('p');
          newCreatedRoomTitleTag.textContent = channelName;
          newCreatedRoomTag.setAttribute('id', `channelId_${validResponse.data.channelId}`);
          newCreatedRoomTag.classList.add('room_title');
          newCreatedRoomTag.appendChild(newCreatedRoomTitleTag);
          roomListArea.appendChild(newCreatedRoomTag);
        }
      })
  }
})