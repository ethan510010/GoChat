// 回到首頁
const backHomePage = document.querySelector('.header span');
backHomePage.addEventListener('click', function() {
  window.location = '/';
}) 
// 回到 namespace 選擇頁
const backNamespaceBtn = document.querySelector('.back_Namespace_btn');
backNamespaceBtn.addEventListener('click', function() {
  window.location = `/namespace?userId=${currentUserDetail.userId}`;
});