const modal = document.getElementById('addRoomModal');

const createRoomBtn = document.querySelector('.room_header .add_room');

// 獲取 close button
var closePopupSpan = document.getElementsByClassName("close")[0];

createRoomBtn.addEventListener('click',function(event) {
  modal.style.display = "block";
})

// popup 關閉按鈕
closePopupSpan.addEventListener('click', function() {
  modal.style.display = "none";
})

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}