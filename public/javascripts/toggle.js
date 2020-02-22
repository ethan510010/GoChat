let toggleShow = false;
const toggleSwitcher = document.querySelector('.header img');
toggleSwitcher.addEventListener('click', function() {
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
signOutBtn.addEventListener('click', function() {
  window.location = '/';
})

// 編輯顯示名稱
const editImageVtn = document.querySelector('.user_name img');
editImageVtn.addEventListener('click', function() {
  const userNamediv = document.querySelector('#profile_area .user_name');
  const userNameTag = document.querySelector('.user_name p');
  const editNameTag = document.createElement('input');
  editNameTag.value = userNameTag.textContent;
  userNameTag.parentNode.replaceChild(editNameTag, userNameTag);
  const confirmCheck = document.createElement('img');
  confirmCheck.src = '/images/check.png';
  userNamediv.appendChild(confirmCheck);
})