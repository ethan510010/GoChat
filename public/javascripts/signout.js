const signoutDiv = document.querySelector('.signoutDiv');
signoutDiv.addEventListener('click', function () {
  // 刪除存在 cookie 的 access token
  document.cookie = 'access_token'+'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
})