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

// email 正則驗證
function validateEmail(email) {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

// 註冊事件
const signupUserNameInputTag = document.querySelector('.enter_username input');
const signupUserEmailTag = document.querySelector('.enter_email_for_signup input');
const signupUserPasswordTag = document.querySelector('.enter_password_for_signup input');
const signupBtn = document.querySelector('.signup_btn');

signupBtn.addEventListener('click', (e) => {
  if (validateEmail(signupUserEmailTag.value)) {
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
      if (typeof(response.data) === 'string') {
        alert('The email has already been registered.')
      } else {
        // 註冊成功進到主聊天界面
      }
    })
  } else {
    alert('You have the wrong email format');
  }
})
