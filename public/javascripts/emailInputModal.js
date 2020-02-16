const inputModal = document.getElementById('emailInputModal');
const closeSpan = document.getElementsByClassName('close')[0];
closeSpan.addEventListener('click', function() {
  inputModal.style.display = 'none';
})

window.addEventListener('click', function (e) {
  if (event.target === inputModal) {
    inputModal.style.display = 'none';
  }
})