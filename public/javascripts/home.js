let showSignupArea = false;
const notMemberTag = document.querySelector('#not_member_hint');
notMemberTag.addEventListener('click', function(event) {
  const signupInfoArea = document.querySelector('.signup_info');
  const displayValue = showSignupArea === true ? 'none' : 'block';
  signupInfoArea.style.display = displayValue;
  showSignupArea = !showSignupArea
})