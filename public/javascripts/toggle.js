let toggleShow = false;
const toggleSwitcher = document.querySelector('.header img');
toggleSwitcher.addEventListener('click', function () {
  toggleShow = !toggleShow;
  const chatContentWidth = toggleShow ? 'calc(75% - 300px)' : '75%';
  const chatContentDiv = document.querySelector('.chat_content');
  chatContentDiv.style.width = chatContentWidth;
  const toggleList = document.getElementById('toggle_list');
  const toggleRightPosition = toggleShow ? 0 : '-300px'
  toggleList.style.right = toggleRightPosition;
  const settingBlockPosition = toggleShow ? '305px' : '5px';
  document.querySelector('.settings_block').style.right = settingBlockPosition;
});

// 登出
const signOutBtn = document.querySelector('#profile_area .sign_out');
signOutBtn.addEventListener('click', function () {
  // 刪除存在 cookie 的 access token
  document.cookie = 'access_token'+'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  window.location = '/';
})

let isEditing = false;
// 編輯顯示名稱
const editImageVtn = document.querySelector('.user_name img');
editImageVtn.addEventListener('click', function () {
  if (isEditing) {
    const userNamediv = document.querySelector('#profile_area .user_name');
    const editNameTag = document.querySelector('#profile_area .user_name input');
    if (editNameTag) {
      const userNameTag = document.createElement('p');
      userNameTag.textContent = currentUserDetail.name;
      userNamediv.replaceChild(userNameTag, editNameTag);
      userNamediv.removeChild(document.querySelector('.checkEdit'));
    }
    isEditing = !isEditing;
    return;
  }
  isEditing = !isEditing;
  editMode(true);
})

// 上傳新的大頭貼
const editAvatar = document.getElementById('avatarSelection');
editAvatar.addEventListener('change', function (e) {
  const fileData = e.target.files[0];
  let reader = new FileReader();
  reader.readAsDataURL(fileData);
  reader.onload = function () {
    socket.emit('editNewAvatar', {
      userInfo: currentUserDetail,
      avatarData: this.result,
      fileName: fileData.name
    }, (response) => {
      if (response.newAvatarUrl) {
        // 更改當前用戶的 
        currentUserDetail.avatarUrl = response.newAvatarUrl;
        const avatarImgTag = document.querySelector('.container .avatar_img');
        avatarImgTag.src = URL.createObjectURL(fileData);
      }
    })
  }
})

// 確認編輯 (因為有時會出現有時沒有，所以這邊用 delegate)
const userNameTag = document.querySelector('#profile_area .user_name');
userNameTag.addEventListener('click', function (e) {
  if (e.target.nodeName.toUpperCase() === 'IMG' && e.target.className === 'checkEdit') {
    const newUserName = document.querySelector('#profile_area .user_name input').value;
    if (/^\s+$/gi.test(newUserName) || newUserName === '') {
      showCustomAlert('Channel 名字不能全為空白');
      return;
    }
    socket.emit('editUserName', {
      userId: currentUserDetail.userId,
      newUserName: newUserName
    }, (response) => {
      if (response.newUserName) {
        // 更改當前用戶的 name
        currentUserDetail.name = response.newUserName;
        editMode(false, response);
        // 因為是在有 toggle list 底下處理，所以下方的名字也要及時更新
        const currentUserTagInOnlineMemberRegion = document.getElementById(`roomMember_${currentUserDetail.userId}`);
        const nameTag = currentUserTagInOnlineMemberRegion.children[1];
        nameTag.textContent = response.newUserName;
        isEditing = false;
      }
    })
  }
})

function editMode(isEditing, response) {
  if (isEditing) {
    const userNamediv = document.querySelector('#profile_area .user_name');
    const userNameTag = document.querySelector('.user_name p');
    const editNameTag = document.createElement('input');
    editNameTag.value = userNameTag.textContent;
    userNameTag.parentNode.replaceChild(editNameTag, userNameTag);
    const confirmCheck = document.createElement('img');
    confirmCheck.classList.add('checkEdit');
    confirmCheck.src = '/images/check.png';
    userNamediv.appendChild(confirmCheck);
  } else {
    const userNamediv = document.querySelector('#profile_area .user_name');
    const editNameTag = document.querySelector('#profile_area .user_name input');
    if (editNameTag) {
      const userNameTag = document.createElement('p');
      userNameTag.textContent = response.newUserName;
      userNamediv.replaceChild(userNameTag, editNameTag);
      userNamediv.removeChild(document.querySelector('.checkEdit'));
    }
  }
}