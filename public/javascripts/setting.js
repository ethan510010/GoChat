let isSettingOpen = false;
const settingBtn = document.querySelector('.room_setting');
settingBtn.addEventListener('click', function() {
  // 如果是要對 general 這個預設的 room 做操作，會跳一個 alert 通知說無法
  // if (currentSelectedRoom.roomId === 1) {
  //   showCustomAlert('channel general can not be set by user');
  //   return;
  // }
  isSettingOpen = !isSettingOpen;
  const displayType = isSettingOpen ? 'block' : 'none';
  document.querySelector('.settings_block').style.display = displayType;  
});

const addPeopleBtn = document.querySelector('.settings_block .add_people');
addPeopleBtn.addEventListener('click', function() {
  // 跳出 Modal 視窗
  // 這邊的話要隱藏裡面的 channel name p 及 channel name input
  resetModalup('updateRoom');
});

const deleteChannelBtn = document.querySelector('.settings_block .delete_channel');
deleteChannelBtn.addEventListener('click', function() {
  const leaveChannel = confirm('Are you sure to leave current channel?');
  if (leaveChannel) {
    // 讓其他人可以看到該用戶退群，所以用 socket，不打 restful api
    // 退群後讓他回到 general
    socket.emit('leaveRoom', {
      leaveUser: currentUserDetail,
      leaveRoom: currentSelectedRoom
    })
  } else {
    document.querySelector('.settings_block').style.display = 'none';
  }
})
// 其他人接收有人離線的通知，退群者看到 UI 切換到 general，並且移除原本該 room 在左側欄
socket.on('leaveRoomNotification', async (leaveNotification) => {
  if (leaveNotification.leaveUser.userId === currentUserDetail.userId) {
    // 刪除後切換到 general 這個 room
    currentSelectedRoom = {
      roomId: 1,
      roomtitle: 'general'
    }
    // 改標題
    const roomTitleTag = document.querySelector('#room_title h1');
    roomTitleTag.textContent = currentSelectedRoom.roomtitle;
    // 旁邊要看不到該房間
    const roomsPad = document.querySelector('.upper_section .rooms');
    const removeRoom = document.getElementById(`channelId_${lastChooseRoom.roomId}`);
    roomsPad.removeChild(removeRoom);
    console.log('lastRoom', lastChooseRoom);
    // 觸發切換房間
    socket.emit('changeRoom', {
      joinRoomInfo: currentSelectedRoom,
      userInfo: currentUserDetail,
      lastChooseRoom: lastChooseRoom
    }, function (finishedInfo) {
      lastChooseRoom.roomId = currentSelectedRoom.roomId;
      lastChooseRoom.roomTitle = currentSelectedRoom.roomTitle;
      // 把提示新訊息的 UI 刪除掉
      const channelIdDiv = document.getElementById(`channelId_${currentSelectedRoom.roomId}`);
      const beRemovedNewMsgMentionTag = channelIdDiv.lastChild;
      if (beRemovedNewMsgMentionTag.nodeName.toUpperCase() === 'DIV' && beRemovedNewMsgMentionTag.className === 'messageMention') {
        channelIdDiv.removeChild(beRemovedNewMsgMentionTag);
      }
      // 切換完成後去抓取歷史訊息 ( 這時要把 currentScrollPage 歸 0)
      currentScrollPage = 0;
      scrollFinished = false;
      socket.emit('getRoomHistory', {
        roomId: currentSelectedRoom.roomId,
        userId: currentUserDetail.userId,
        userSelectedLanguge: currentUserDetail.selectedLanguage,
        page: currentScrollPage,
        changeRoomMode: true
      })
      // 切頁完成後去抓取 canvas 結果
      socket.emit('getRoomCanvas', {
        roomId: currentSelectedRoom.roomId,
        userId: currentUserDetail.userId,
      })
    })
  } else {
    const notifyConfig = {
      body: `${leaveNotification.leaveUser.name} leaves`
    }
    // 代表是其他人收到某人的退群通知
    if (!('Notification' in window)) {
      console.log('This browser does not support notification');
    } else if (Notification.permission === 'granted') {
      const notification = new Notification(
        `${leaveNotification.leaveUser.name} leaves ${leaveNotification.leaveRoom.roomTitle}`, 
        notifyConfig
      )
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission(function(permission) {
        if (permission === 'granted') {
          const notification = new Notification(`${leaveNotification.leaveUser.name} leaves ${leaveNotification.leaveRoom.roomTitle}`, 
          notifyConfig);
        }
      });
    }
  }
})