const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

// context 基本設定
context.lineCap = 'round';
context.lineJoin = 'round';
context.strokeStyle = '#000000';
context.lineWidth = 5;

// 紀錄 canvas 是否有動作
let isDrawing = false;

// 紀錄當前座標
let lastX = 0;
let lastY = 0;

// 按下滑鼠
canvas.addEventListener('mousedown', function(e) {
  isDrawing = true;

  lastX = e.offsetX;
  lastY = e.offsetY;
})

// 移動滑鼠
canvas.addEventListener('mousemove', function(e) {
  e.preventDefault();

  if (isDrawing) {
    drawStroke(e)
  }
  lastX = e.offsetX;
  lastY = e.offsetY;
});

// 放開滑鼠
canvas.addEventListener('mouseup', function (e) {
  e.preventDefault();

  isDrawing = false;
})

// 滑鼠移出 canvas
canvas.addEventListener('mouseout', function(e) {
  e.preventDefault();
  isDrawing = false;
})

function drawStroke(e) {
    context.beginPath(); // 開始建立路徑
    context.moveTo(lastX, lastY); // 移動當前所在位置
    context.lineTo(e.offsetX, e.offsetY); // 拉到的目的地
    context.closePath();  // 關閉路徑
    context.stroke();     // 描邊此路徑
    
    // 發送 socket 訊息
    const drawInfo = {
      originalX: lastX,
      originalY: lastY,
      destinationX: e.offsetX, 
      destinationY: e.offsetY
    }
    socket.emit('draw', {
      drawInfo: drawInfo,
      roomDetail: currentSelectedRoom,
      userInfo: currentUserDetail,
    })
}

socket.on('showDrawData', (drawInfoFromServer) => {
  const { roomId } = drawInfoFromServer.roomDetail;
  console.log('畫圖的房間資訊', roomId);
  context.beginPath();
  context.moveTo(drawInfoFromServer.drawInfo.originalX, drawInfoFromServer.drawInfo.originalY);
  context.lineTo(drawInfoFromServer.drawInfo.destinationX, drawInfoFromServer.drawInfo.destinationY);
  context.closePath();
  context.stroke();
})