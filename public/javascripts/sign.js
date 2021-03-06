const signupAndSigninBlock = document.querySelector('.sign_in_block');
const setLanguageBlock = document.querySelector('.set_language_avatar_area');
// 當註冊或登入後把 userId 存下來後面設定語言及大頭貼會用到
let userId;

// email 正則驗證
function validateEmail(email) {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

// password 驗證只能輸入英文字母跟數字
function validPassord(password) {
  const pattern = /^[A-Za-z0-9][A-Za-z0-9]*$/;
  return pattern.test(String(password).toLowerCase());
}

// 註冊事件
const signupUserNameInputTag = document.querySelector('.enter_username input');
const signupUserEmailTag = document.querySelector('.enter_email_for_signup input');
const signupUserPasswordTag = document.querySelector('.enter_password_for_signup input');
if (signupUserPasswordTag) {
  signupUserPasswordTag.addEventListener('keypress', function(e) {
    if (e.keyCode === 13) {
      e.preventDefault();
      signupBtn.click();
     }
  })  
}
const signupBtn = document.querySelector('.signup_btn');

if (signupBtn) {
  signupBtn.addEventListener('click', (e) => {
    
    if (!validPassord(signupUserPasswordTag.value)) {
      showCustomAlert('The passord can only be english and number characters');
      return;
    }

    let bodyParas;
    if (defaultRoomId) {
      bodyParas = {
        username: signupUserNameInputTag.value,
        email: signupUserEmailTag.value,
        password: signupUserPasswordTag.value,
        beInvitedRoomId: defaultRoomId
      }
    } else {
      bodyParas = {
        username: signupUserNameInputTag.value,
        email: signupUserEmailTag.value,
        password: signupUserPasswordTag.value
      }
    }
    if (validateEmail(signupUserEmailTag.value)) {
      fetch('/users/signup', {
        method: 'POST',
        body: JSON.stringify(bodyParas),
        headers: new Headers({
          'Content-Type': 'application/json',
        })
      })
      .then((res) => res.json())
      .catch((error) => console.log(error))
      .then((response) => {
        if (typeof(response.data) === 'string') {
          showCustomAlert('The email has already registerd');
        } else {
          document.cookie = `access_token=${response.data.accessToken}`;
          // 註冊成功進到設定頁
          showCustomAlert('Please receive verification email');
          // showUserSettingBlock(response.data.user);
        }
      })
    } else {
      showCustomAlert('You have the wrong email format');
    }
  })
}

// 一般登入
const signinUserEmailTag = document.querySelector('.enter_email input');
const signinUserPasswordTag = document.querySelector('.enter_password input');
if (signinUserPasswordTag) {
  signinUserPasswordTag.addEventListener('keypress', function(e) {
    if (e.keyCode === 13) {
      e.preventDefault();
      signinBtn.click();
     }
  })  
}
const signinBtn = document.querySelector('.sign_in_button');
// 只有被邀請的用戶才會有這個 defaultRoomId
// const currentUrl = new URL(window.location)
// const defaultRoomId = currentUrl.searchParams.get('defaultRoomId');
if (signinBtn) {
  signinBtn.addEventListener('click', function(event) {
    let bodyParas;
    if (defaultRoomId) {
      bodyParas = {
        email: signinUserEmailTag.value,
        password: signinUserPasswordTag.value,
        signinway: 'native',
        beInvitedRoomId: defaultRoomId
      }
    } else {
      bodyParas = {
        email: signinUserEmailTag.value,
        password: signinUserPasswordTag.value,
        signinway: 'native'
      }
    }
    fetch('/users/signin', { 
      method: 'POST',
      body: JSON.stringify(bodyParas),
      headers: new Headers({
        'Content-Type': 'application/json'
      })
    })
    .then((res) => res.json())
    .catch((err) => console.log(err))
    .then((response) => {
      if (typeof(response.data) === 'string') {
        showCustomAlert('check the email and the password are correct');
      } else {
        // 登入成功，但要看是否有激活該帳戶，有的話才跳轉到 settingBlock
        if (response.data.isActive === false) {
          showCustomAlert('The email address is anot active, please receive verified email or register again.')
        } else {
          document.cookie = `access_token=${response.data.accessToken}`;
          showUserSettingBlock(response.data.user);
        }
      }
    })
  })
}

// FB 登入
// 前端 Fb 登入拿 Token
const fbLoginBtn = document.querySelector('.facebook_login_area');
if (fbLoginBtn) {
  fbLoginBtn.addEventListener('click', function (e) {
    FB.getLoginStatus((response) => {
      statusChangeCallback(response);
    });
  })
}

function statusChangeCallback(response) {
  if (response.status === 'connected') {
    // user登入了
    const { accessToken } = response.authResponse;
    fetchUserInfo(accessToken);
  } else {
    FB.login((fbResponse) => {
      // 拿到accessToken，提供給後端
      statusChangeCallback(fbResponse);
    }, { scope: 'public_profile,email' });
  }
}

// 前端打我們自己的後端 api
function fetchUserInfo(accessToken) {
  // 只有被邀請的用戶才會有這個 defaultRoomId
  // const currentUrl = new URL(window.location)
  // const defaultRoomId = currentUrl.searchParams.get('defaultRoomId');
  let bodyParas;
  if (defaultRoomId) {
    bodyParas = {
      signinway: 'facebook',
      thirdPartyAuthToken: accessToken,
      beInvitedRoomId: defaultRoomId
    }
  } else {
    bodyParas = {
      signinway: 'facebook',
      thirdPartyAuthToken: accessToken,
    }
  }
  // 打我們自己的api
  fetch('/users/signin', {
    method: 'POST',
    body: JSON.stringify(bodyParas),
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
  })
    .then((response) => response.json())
    .catch((error) => console.log(error))
    .then((info) => {
      // 前端設定cookie
      document.cookie = `access_token=${info.data.accessToken}`;
      // 切換到主頁
      showUserSettingBlock(info.data.user);
    });
}

function showUserSettingBlock(userInfo) { 
  userId = userInfo.id;
  signupAndSigninBlock.style.display = 'none';
  const userAvatarImgTag = document.querySelector('#user_basic .user_avatar');
  const userNameTag = document.querySelector('#user_basic .setting_user_name');
  const userLanguageTag = document.querySelector('#user_basic .userLanguage');
  userAvatarImgTag.src = userInfo.avatarUrl;
  userNameTag.textContent = `Hello, ${userInfo.name}`
  let preferredLanguage = '';
  switch (userInfo.selectedLanguage) {
    case 'en':
      preferredLanguage = 'English';
      break;
    case 'zh-TW':
      preferredLanguage = '繁體中文';
      break;
    case 'ja':
      preferredLanguage = 'Japanese';
      break;
    case 'es':
      preferredLanguage = 'Spanish';
      break;
  }
  userLanguageTag.textContent = `Your preferred language: ${preferredLanguage}`;
  setLanguageBlock.style.display = 'flex';
}

// 切換登入還是註冊時 a tag 的 href 設定
if (defaultRoomId && inviteNamespaceId) {
  if (document.getElementById('has_already_member')) {
    document.getElementById('has_already_member').parentNode.href =  `/signin?inviteNamespaceId=${inviteNamespaceId}&defaultRoomId=${defaultRoomId}`;  
  }
  if (document.getElementById('not_member_hint')) {
    document.getElementById('not_member_hint').parentNode.href = `/signup?inviteNamespaceId=${inviteNamespaceId}&defaultRoomId=${defaultRoomId}`;  
  }
} else {
  if (document.getElementById('has_already_member')) {
    document.getElementById('has_already_member').parentNode.href =  `/signin`;  
  }
  if (document.getElementById('not_member_hint')) {
    document.getElementById('not_member_hint').parentNode.href = `/signup`;  
  }
}
