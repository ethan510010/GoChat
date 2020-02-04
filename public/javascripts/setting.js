let isSettingOpen = false;
const settingBtn = document.getElementById('room_setting');
settingBtn.addEventListener('click', function() {
  // 如果是要對 general 這個預設的 room 做操作，會跳一個 alert 通知說無法
  if (currentSelectedRoom.roomId === 1) {
    alert('channel general can not be set by user');
    return;
  }
  isSettingOpen = !isSettingOpen;
  const displayType = isSettingOpen ? 'block' : 'none';
  document.querySelector('header .settings_block').style.display = displayType;  
});

const addPeopleBtn = document.querySelector('.settings_block .add_people');
addPeopleBtn.addEventListener('click', function() {
  // 跳出 Modal 視窗
  // 這邊的話要隱藏裡面的 channel name p 及 channel name input
  shouldHideChannelInput(true);
  modal.style.display = 'block';
});