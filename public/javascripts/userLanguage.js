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

selectLanguageTag.addEventListener('change', function () {
  if (userId) {
    fetch('/language/userPreferedLanguage', {
      body: JSON.stringify({
        userId: userId,
        selectedLanguage: selectLanguageTag.value
      }),
      headers: new Headers({
        'Content-Type': 'application/json'
      }),
      method: 'PUT',
    })
    .then(response => response.json())
    .catch(error => console.log(error))
    .then((validResponse) => {
      if (validResponse.data === 'success') {
        const userLanguageTag = document.querySelector('.userLanguage');
        let selectedUILanguage = '';
        switch (selectLanguageTag.value) {
          case 'en':
            selectedUILanguage = 'English';
            break;
          case 'zh-TW':
            selectedUILanguage = 'Traditional Chinese';
            break;
          case 'ja':
            selectedUILanguage = 'Japanese';
            break;
          case 'es':
            selectedUILanguage = 'Spanish';
            break;
        }
        userLanguageTag.textContent = `User preferred language: ${selectedUILanguage}`;
      }
    })
  }
})
// 上傳用戶大頭貼
const uploadAvatarTag = document.getElementById('customFileInput');
uploadAvatarTag.addEventListener('change', function(e) {
  const fileData = e.target.files[0];
  console.log('上傳大頭貼的檔案資訊', fileData);
  // 這邊要補做一隻上傳大頭貼的 api
  const userAvatarImageTag = document.querySelector('#user_basic .user_avatar');
  userAvatarImageTag.src = URL.createObjectURL(fileData);
})

// 進入房間
const enterChatRoomBtn = document.querySelector('#user_basic .enter_button');
enterChatRoomBtn.addEventListener('click', function(e) {
  // window.location = '/chatPage.html'
  window.location = `/chat?userId=${userId}`
})

