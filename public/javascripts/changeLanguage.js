const editLanguage = document.querySelector('.language .edit_icon');
const languageOptions = document.querySelector('.language-options-container');
editLanguage.addEventListener('click', function () {
  languageOptions.classList.toggle('active');
});

languageOptions.addEventListener('click', function (e) {
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
  // 利用 socket 去更新使用者語言
  socket.emit('editUserLanguage', {
    userId: currentUserDetail.userId,
    selectedLanguage: selectedLanguageValue
  }, (response) => {
    if (response.selectedLanguage) {
      // 更新 UI
      languageOptions.classList.remove('active');
      document.querySelector('.language .user_language').textContent = selectedUILanguage;
    }
  })
})