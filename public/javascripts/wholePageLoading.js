function showLoading() {
  const freezeLayer = document.getElementById('freezeArea');
  freezeLayer.style.display = 'block';
  const loadingArea = document.querySelector('.outer_spinner_div');
  loadingArea.style.display = 'flex';
}

function hideLoading() {
  const freezeLayer = document.getElementById('freezeArea');
  freezeLayer.style.display = 'none';
  const loadingArea = document.querySelector('.outer_spinner_div');
  loadingArea.style.display = 'none';
}