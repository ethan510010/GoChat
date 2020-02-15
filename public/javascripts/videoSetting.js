const shrinkVideoBtn = document.getElementById('shrink_video_screen');
let fullScreenVideoMode = true;
shrinkVideoBtn.addEventListener('click', function () {
  if (fullScreenVideoMode) {
    videoDisplayDiv.classList.add('shrinkMode');
    fullScreenVideoMode = false;  
  } else {
    videoDisplayDiv.classList.remove('shrinkMode');
    videoDisplayDiv.removeAttribute('style');
    videoDisplayDiv.style.display = 'block'
    fullScreenVideoMode = true;
  }
})

let offset = [0, 0];
let isDown = false;
if (fullScreenVideoMode) {
  videoDisplayDiv.addEventListener('mousedown', function (e) {
    isDown = true;
    offset = [
      videoDisplayDiv.offsetLeft - e.clientX,
      videoDisplayDiv.offsetTop - e.clientY
    ];
  }, true);
  
  document.addEventListener('mouseup', function () {
    isDown = false;
  }, true);
  
  document.addEventListener('mousemove', function (event) {
    event.preventDefault();
    if (isDown) {
      mousePosition = {
        x: event.clientX,
        y: event.clientY
      };
      videoDisplayDiv.style.left = (mousePosition.x + offset[0]) + 'px';
      videoDisplayDiv.style.top = (mousePosition.y + offset[1]) + 'px';
    }
  }, true);
}

