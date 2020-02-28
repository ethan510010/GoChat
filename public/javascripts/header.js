const logo = document.querySelector('.logo');
logo.addEventListener('click', function() {
  window.location = '/';
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