const shrinkVideoBtn = document.getElementById('shrink_video_screen');
let fullScreenVideoMode = true;
shrinkVideoBtn.addEventListener('click', function () {
  if (fullScreenVideoMode) {
    videoDisplayDiv.classList.add('shrinkMode');
    document.getElementById('shrink_video_screen').src = '/images/largeScreen.png';
    fullScreenVideoMode = false;  
  } else {
    videoDisplayDiv.classList.remove('shrinkMode');
    videoDisplayDiv.removeAttribute('style');
    videoDisplayDiv.style.display = 'block';
    document.getElementById('shrink_video_screen').src = '/images/shrinkScreen.png';
    fullScreenVideoMode = true;
  }
})

let offset = [0, 0];
let isDown = false;
videoDisplayDiv.addEventListener('mousedown', function(e) {
  isDown = true;
  offset = [
    videoDisplayDiv.offsetLeft - e.clientX,
    videoDisplayDiv.offsetTop - e.clientY
  ];
}, true);

videoDisplayDiv.addEventListener('mouseup', function(e) {
  isDown = false;
}, true);

videoDisplayDiv.addEventListener('mousemove', function (e) {
  e.preventDefault();
  if (isDown && !fullScreenVideoMode) {
    mousePosition = {
      x: event.clientX,
      y: event.clientY
    };
    videoDisplayDiv.style.left = (mousePosition.x + offset[0]) + 'px';
    videoDisplayDiv.style.top = (mousePosition.y + offset[1]) + 'px';
  }
})