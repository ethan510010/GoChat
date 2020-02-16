// 彈出視窗
const addNamespaceBtn = document.getElementById('float_button');
const emailArea = document.querySelector('.invite_email_area');
addNamespaceBtn.addEventListener('click', function() { 
  inputModal.style.display = 'block';
})
// email 確認
const confirmEmailBtn = document.querySelector('.confirmBtn');
confirmEmailBtn.addEventListener('click', function() { 
  const email = document.querySelector('.enter_email').value;;
  if (email !== '') {
    const emailFunctionTag = document.createElement('div');
    emailFunctionTag.classList.add('emailTag');
    const emailAddressTag = document.createElement('div');
    emailAddressTag.classList.add('emailName');
    emailAddressTag.textContent = email;
    emailFunctionTag.setAttribute('id', email);
    const deleteEmailTag = document.createElement('div');
    deleteEmailTag.classList.add('deleteEmail');
    deleteEmailTag.textContent = 'x';
    emailFunctionTag.appendChild(emailAddressTag);
    emailFunctionTag.appendChild(deleteEmailTag);
    emailArea.appendChild(emailFunctionTag);
    document.querySelector('.enter_email').value = '';
  }
})

// 刪除 email 
emailArea.addEventListener('click', function(event) {
  if (event.target.nodeName.toUpperCase() === 'DIV' && event.target.getAttribute('class') === 'deleteEmail') {
    const deleteTarget = event.target.parentNode;
    emailArea.removeChild(deleteTarget)
  }
})

// 包裝 fetch api
async function encapsulateFetch(url, bodyParas, method) {
  if (method === 'POST') {
    const response = await fetch(url, {
      method: method,
      body: JSON.stringify(bodyParas),
      headers: {
        'content-type': 'application/json'
      }
    });
    const validResponse = await response.json();
    return validResponse.data;  
  } else if (method === 'GET') {
    const response = await fetch(url);
    const validResponse = await response.json();
    return validResponse.data;
  }
}

// 創建 namespace
const inviteButton = document.getElementById('invite_btn');
const currentUrl = new URL(window.location)
const userId = currentUrl.searchParams.get('userId');
inviteButton.addEventListener('click', async function() {
  const namespaceInput = document.querySelector('.namespace_input input').value;
  if (namespaceInput === '') {
    alert('沒有輸入 namespace')
    return;
  }
  const createNamespaceResult = await encapsulateFetch('/namespace/createNamespace', {
    namespaceName: namespaceInput,
    createNamespaceUserId: userId
  }, 'POST');
  const newNamespaceId = createNamespaceResult.namespaceId;
  // 顯示在畫面上
  const namespacesArea = document.querySelector('.namespaces_area');
  if (namespacesArea.contains(document.querySelector('.namespaces_area h2'))) {
    namespacesArea.innerHTML = '';  
  }
  const namespaceBlock = document.createElement('div');
  namespaceBlock.classList.add('namespaceBlock');
  namespaceBlock.setAttribute('id', `namespaceId_${newNamespaceId}`);
  const namespaceNameTag = document.createElement('p');
  namespaceNameTag.textContent = namespaceInput;
  const inviteButton = document.createElement('input');
  inviteButton.type = 'button';
  inviteButton.value = 'invite people to namespace';
  const enterNamespaceBtn = document.createElement('input');
  enterNamespaceBtn.type = 'button';
  enterNamespaceBtn.value = 'enter this namespace';
  namespaceBlock.appendChild(namespaceNameTag);
  namespaceBlock.appendChild(inviteButton);
  namespaceBlock.appendChild(enterNamespaceBtn);
  namespacesArea.appendChild(namespaceBlock);
  // 發送驗證信
  let emailList = [];  
  for (let i = 0; i < emailArea.children.length; i++) {
    const email = emailArea.children[i].id;
    emailList.push(email);
  }
  const sendEmailResult = await encapsulateFetch('/namespace/invitePeople', {
    emailList: emailList,
    namespaceId: newNamespaceId
  }, 'POST')
  if (sendEmailResult) {
    alert('邀請信送出成功');
  }
})
