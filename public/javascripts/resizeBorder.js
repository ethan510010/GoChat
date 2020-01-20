window.onload = function() {
  const resizeTag = document.getElementById('resize');
  const chatAreaDiv = document.getElementById('chat_area');
  const drawAreaDiv = document.getElementById('draw_area');
  const chatContentDiv = document.querySelector('.chat_content');
  resizeTag.onmousedown = function(e) {
    const startY = e.clientY;
    resizeTag.top = resizeTag.offsetTop;
    document.onmousemove = function(e) {
      const endY = e.clientY;
      let moveLen = resizeTag.top + (endY - startY);
      const maxMoveLen = chatContentDiv.clientHeight - resizeTag.offsetHeight;
      if (moveLen < 50) {
        moveLen = 50;
      }
      if (moveLen > maxMoveLen - 50) {
        moveLen = maxMoveLen - 50;
      }
      resizeTag.style.top = moveLen;
      chatAreaDiv.style.height = moveLen + 'px';
      drawAreaDiv.style.height = (chatContentDiv.clientHeight - moveLen - 3) + 'px';
    }
    document.onmouseup = function(e) {
      document.onmousemove = null;
      document.onmouseup = null; 
      resizeTag.releaseCapture && resizeTag.releaseCapture();
    }
    resizeTag.setCapture && resizeTag.setCapture();
    return false
  }
}