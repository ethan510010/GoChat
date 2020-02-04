const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

// context 基本設定
context.lineCap = 'round';
context.lineJoin = 'round';
context.strokeStyle = '#000000';
context.lineWidth = 5;
let currentStrokeColor = '';

// 紀錄 canvas 是否有動作
let isDrawing = false;

// 紀錄當前座標
let lastX = 0;
let lastY = 0;

// 紀錄是否開啟橡皮擦
let eraserEnabled = false;

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
    drawOrEraseStroke(e)
  }
  // if (isDrawing && !eraserEnabled) {
  //   drawOrEraseStroke(e)
  // } else {
  //   context.clearRect(lastX, lastY, 15, 15);
  // }
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

function drawOrEraseStroke(e) {
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
      strokeColor: currentStrokeColor,
      roomDetail: currentSelectedRoom,
      userInfo: currentUserDetail,
    })
}

// 可以選顏色
const drawColorOptions = document.querySelector('.color_options');
drawColorOptions.addEventListener('click', function(e) {
  if (e.target.nodeName.toUpperCase() === 'DIV') {
    eraserEnabled = false;
    switch (e.target.className) {
      case 'red_block':
        currentStrokeColor = '#F20000';
        break;
      case 'orange_block':
        currentStrokeColor = '#FFAF03';
        break;
      case 'green_block':
        currentStrokeColor = '#08CF26';
        break;
      case 'blue_block':
        currentStrokeColor = '#034EFF';
        break;
      case 'black_block':
        currentStrokeColor = '#000000';
        break;
    }
    context.strokeStyle = currentStrokeColor;
  }
})

// 橡皮擦效果
const eraserBtn = document.querySelector('.eraser');
eraserBtn.addEventListener('click', function() {
  eraserEnabled = true;
})

// 清空 canvas
const clearCanvasBtn = document.querySelector('.clear_btn');
clearCanvasBtn.addEventListener('click', function() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  socket.emit('canvasClear', {
    roomDetail: currentSelectedRoom,
    userInfo: currentUserDetail,
  })
})

socket.on('clearDrawContent', (clearDrawMsg) => {
  if (clearDrawMsg) {
    eraserEnabled = false;
    context.clearRect(0, 0, canvas.width, canvas.height);
  }
})
// 可以下載 canvas
const downloadLink = document.querySelector('.download_btn a');
downloadLink.addEventListener('click', function() {
  downloadLink.href = canvas.toDataURL();
  downloadLink.download = 'canvas.png';
})

socket.on('showDrawData', (drawInfoFromServer) => {
  context.strokeStyle = drawInfoFromServer.strokeColor;
  context.beginPath();
  context.moveTo(drawInfoFromServer.drawInfo.originalX, drawInfoFromServer.drawInfo.originalY);
  context.lineTo(drawInfoFromServer.drawInfo.destinationX, drawInfoFromServer.drawInfo.destinationY);
  context.closePath();
  context.stroke();
})