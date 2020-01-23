// // Socket.io 有關的 code
// const socket = io.connect('ws://localhost:3000');

// // 切換 Room
// let roomDetail = {};
// const sidePadChannelSection = document.querySelector('.side_pad .upper_section');
// sidePadChannelSection.addEventListener('click', function(event) {
//   if (event.target && event.target.nodeName.toUpperCase() === 'DIV') {
//     roomDetail = {
//       roomId: event.target.getAttribute('id'),
//       roomTitle: event.target.textContent 
//     }
//     const roomTitleTag = document.querySelector('#room_title h1');
//     roomTitleTag.textContent = roomDetail.roomTitle;

//     // 切換房間時同時加入到 Room，同時把 userId 送上來 （尚未做）
//     socket.emit('join', roomDetail, (error) => {
//       if (error) {
//         alert(error)
//         window.location ='/'
//       }
//     })
//   }
// })

// // 發送簡單訊息
// const enterMessageInput = document.querySelector('#message_window');
// const sendMessageBtn = document.querySelector('#send_btn');

// sendMessageBtn.addEventListener('click', function() {
//   socket.emit('clientMessage', enterMessageInput.value);
// })

// // 接收 Server 端發過來的 message 事件
// socket.on('message', (dataFromServer) => {
//   console.log(dataFromServer)  
// })