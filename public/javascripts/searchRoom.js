const searchRoomTag = document.querySelector('.wrapper .search');
searchRoomTag.addEventListener('keyup', function (e) {
  const rooms = document.querySelectorAll('.rooms .room_title');
  searchChannel(e.target.value, rooms);
})

function searchChannel(searchWord, rooms) {
  searchWord = searchWord.toLowerCase();
  for (let i = 0; i < rooms.length; i++) {
    const roomDetailTag = rooms[i];
    const roomTitle = roomDetailTag.children[1].textContent.toLowerCase();
    if (roomTitle.indexOf(searchWord) !== -1) {
      roomDetailTag.style.display = 'flex';
    } else {
      roomDetailTag.style.display = 'none';
    }
  }
}