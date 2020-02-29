function showCustomAlert(title) {
  const alertBox = document.getElementById('box');
  alertBox.style.top = '150px';
  alertBox.style.opacity = 1;
  const alertTitleTag = document.querySelector('#box h3');
  alertTitleTag.textContent = title;
  const freezeLayer = document.getElementById('freezeBlock');
  freezeLayer.style.display = '';

  const closeAlertTag = document.querySelector('#box a');
  closeAlertTag.addEventListener('click', function() {
    alertBox.style.top = '-500px';
    alertBox.style.opacity = 0;
    freezeLayer.style.display = 'none';
  })
}