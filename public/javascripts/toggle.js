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
});