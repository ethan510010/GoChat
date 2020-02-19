let toggleShow = false;
const toggleSwitcher = document.querySelector('.header img');
toggleSwitcher.addEventListener('click', function() {
  toggleShow = !toggleShow;
  const toggleList = document.getElementById('toggle_list');
  const toggleRightPosition = toggleShow ? 0 : '-300px'
  toggleList.style.right = toggleRightPosition;
});