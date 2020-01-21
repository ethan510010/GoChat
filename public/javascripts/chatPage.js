// restful api 拿取必要資訊
// 1. userProfile
// 取得 cookie 裡面的 token
function getCookie(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for(var i = 0; i <ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

const accessToken = getCookie('access_token');
if (!accessToken || accessToken === '') {
  window.location = '/';
} else {
  fetch('/users/profile', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
  .then((response) => response.json())
  .catch((err) => console.log(err))
  .then((validResponse) => {
    if (typeof validResponse.data === 'string') {
      console.log('獲取用戶資料有問題');
      window.location = '/'
    } else {
      const avatarImg = document.querySelector('#small_avatar img');
      avatarImg.src = validResponse.data.avatarUrl;
      console.log('email', validResponse.data.email);
      console.log('name', validResponse.data.name);
    }
  })
}
