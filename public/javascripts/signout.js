const signoutDiv = document.querySelector('.signoutDiv');
signoutDiv.addEventListener('click', function () {
  // 刪除存在 cookie 的 access token
  document.cookie = 'access_token'+'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
})

// 取得 cookie 裡面的 token
function getCookie(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return '';
}

const logo = document.querySelector('.logo');
logo.addEventListener('click', function() {
  if (getCookie('access_token')) {
    location.reload();
  } else {
    window.location = '/';
  }
})
const signupTag = document.getElementById('header_sign_up');
const signinTag = document.getElementById('header_sign_in');
// 只有被邀請信邀請的才會有這個 defaultRoomId
const currentUrl = new URL(window.location);
const inviteNamespaceId = currentUrl.searchParams.get('inviteNamespaceId');
const defaultRoomId = currentUrl.searchParams.get('defaultRoomId');

if (signupTag) {
  if (inviteNamespaceId && defaultRoomId) {
    signupTag.href = `/signup?inviteNamespaceId=${inviteNamespaceId}&defaultRoomId=${defaultRoomId}`;
  } else {
    signupTag.href = '/signup'
  }
}

if (signinTag) {
  if (inviteNamespaceId && defaultRoomId) {
    signinTag.href = `/signin?inviteNamespaceId=${inviteNamespaceId}&defaultRoomId=${defaultRoomId}`;
  } else {
    signinTag.href = '/signin'
  }
}