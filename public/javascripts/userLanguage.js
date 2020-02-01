// 切換語言
const selectLanguageTag = document.querySelector('#user_basic select');
// 取得 query String
function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

const userId = getParameterByName('userId', window.location);

// 下拉選單
const selected = document.querySelector('.selected');
const selectedParaTag = document.querySelector('.selected p');
const optionsContainer = document.querySelector('.options-container');

const optionsList = document.querySelectorAll('.option');

selected.addEventListener('click', () => {
  optionsContainer.classList.toggle('active');
});

// 測試 event delegate
optionsContainer.addEventListener('click', function(e) {
  let selectedUILanguage = '';
  let selectedLanguageValue = '';
  switch (e.target.nodeName.toUpperCase()) {
    case 'DIV':
      const innerLabel = e.target.querySelector('label');
      selectedLanguageValue = innerLabel.getAttribute('for');
      selectedUILanguage = innerLabel.innerHTML;
      break;
    case 'LABEL':
      selectedLanguageValue = e.target.getAttribute('for');
      selectedUILanguage = e.target.innerHTML;
      e.preventDefault();
      break;
  }
  // 打 api
  if (userId) {
    fetch('/language/userPreferedLanguage', {
      body: JSON.stringify({
        userId: userId,
        selectedLanguage: selectedLanguageValue
      }),
      headers: new Headers({
        'Content-Type': 'application/json'
      }),
      method: 'PUT'
    })
    .then((response) => response.json())
    .catch((error) => console.log(error))
    .then((validResponse) => {
      if (validResponse.data === 'success') {
        const userLanguageTag = document.querySelector('.userLanguage');
        userLanguageTag.textContent = `User preferred language: ${selectedUILanguage}`;
        selectedParaTag.innerHTML = selectedUILanguage;
        optionsContainer.classList.remove('active');
      }
    })
  }
  
})

// 上傳用戶大頭貼
const uploadAvatarTag = document.getElementById('customFileInput');
uploadAvatarTag.addEventListener('change', function(e) {
  const fileData = e.target.files[0];
  console.log('要上傳的大頭貼資訊', fileData);
  // 上傳打 api
  const formData = new FormData();
  formData.append('userAvatar', fileData);
  formData.append('userId', userId);
  const options = {
    method: 'PUT',
    body: formData
  }
  fetch('/users/renewUserAvatar', options)
  .then(response => response.json())
  .catch(error => console.log(error))
  .then((validResponse) => {
    if (validResponse.data) {
      const userAvatarImageTag = document.querySelector('#user_basic .user_avatar');
      userAvatarImageTag.src = URL.createObjectURL(fileData);
    }
  })
})

// 進入房間
const enterChatRoomBtn = document.querySelector('#user_basic .enter_button');
enterChatRoomBtn.addEventListener('click', function(e) {
  // window.location = '/chatPage.html'
  window.location = `/chat?userId=${userId}`
})

