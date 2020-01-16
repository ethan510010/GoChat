let showSignupArea = false;
const notMemberTag = document.querySelector('#not_member_hint');
notMemberTag.addEventListener('click', function(event) {
  const signupInfoArea = document.querySelector('.signup_info');
  const displayValue = showSignupArea === true ? 'none' : 'block';
  signupInfoArea.style.display = displayValue;

  const signInArea = document.querySelector('.sign_in_area');
  
  const signInHidden = showSignupArea === true ? 'block' : 'none';
  signInArea.style.display = signInHidden;

  showSignupArea = !showSignupArea
})
// 註冊事件
const signupUserNameInputTag = document.querySelector('.enter_username input');
const signupUserEmailTag = document.querySelector('.enter_email_for_signup input');
const signupUserPasswordTag = document.querySelector('.enter_password_for_signup input');
const signupBtn = document.querySelector('.signup_btn');
console.log(signupUserNameInputTag);
console.log('資料', signupUserNameInputTag.value)
signupBtn.addEventListener('click', (e) => {
  fetch('/users/signup', {
    method: 'POST',
    body: JSON.stringify({
      username: signupUserNameInputTag.value,
      email: signupUserEmailTag.value,
      password: signupUserPasswordTag.value
    }),
    headers: new Headers({
      'Content-Type': 'application/json',
    })
  })
  .then((res) => res.json())
  .catch((error) => console.log(error))
  .then((response) => {
    console.log(response)
  })
})
