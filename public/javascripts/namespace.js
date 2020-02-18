let isEditNamespaceMode = true;
let beSelectedNamespaceBlock;
// 彈出視窗
const addNamespaceBtn = document.getElementById('float_button');
const emailArea = document.querySelector('.invite_email_area');
const namespacesArea = document.querySelector('.namespaces_area');
addNamespaceBtn.addEventListener('click', function() { 
  isEditNamespaceMode = false;
  inputModalAppearance(isEditNamespaceMode, true, '');
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
  if (method === 'POST' || method === 'PUT') {
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
  if (!isEditNamespaceMode) {
    if (namespaceInput === '') {
      alert('沒有輸入 namespace')
      return;
    }  
    const createNamespaceResult = await encapsulateFetch('/namespace/createNamespace', {
      namespaceName: namespaceInput,
      createNamespaceUserId: userId
    }, 'POST');
    const newNamespaceId = createNamespaceResult.namespaceId;
    const newNamespaceName = createNamespaceResult.newNamespaceName;
    const newDefaultRoomId = createNamespaceResult.newDefaultRoomId;
    // 顯示在畫面上
    if (namespacesArea.contains(document.querySelector('.namespaces_area h2'))) {
      namespacesArea.innerHTML = '';  
    }
    const namespaceBlock = document.createElement('div');
    namespaceBlock.classList.add('namespaceBlock');
    namespaceBlock.setAttribute('id', `namespaceId_${newNamespaceId}`);
    const namespaceNameTag = document.createElement('p');
    namespaceNameTag.textContent = newNamespaceName;
    const inviteButton = document.createElement('input');
    inviteButton.type = 'button';
    inviteButton.value = 'invite people to namespace';
    const enterNamespaceBtn = document.createElement('input');
    enterNamespaceBtn.type = 'button';
    enterNamespaceBtn.classList.add('enter_namespace_btn');
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
      namespaceId: newNamespaceId,
      newDefaultRoomId: newDefaultRoomId,
      invitor: currentUser.name,
    }, 'POST')
    if (sendEmailResult) {
      alert('邀請信送出成功');
    }
    // 代表是編輯 namespace，打 updateNamespace
  } else {
    const updateNamespaceTitleTag = beSelectedNamespaceBlock.children[0];
    const shouldUpdateNamespaceId = beSelectedNamespaceBlock.id.replace('namespaceId_', '');
    const updateNamespaceResult = await encapsulateFetch('/namespace/updateNamespace', {
      updateNamespaceId: shouldUpdateNamespaceId,
      updateNamespaceName: document.querySelector('.namespace_input input').value
    }, 'PUT');
    if (updateNamespaceResult) {
      updateNamespaceTitleTag.textContent = updateNamespaceResult.updateNamespaceName
    }
    let emailList = [];  
    for (let i = 0; i < emailArea.children.length; i++) {
      const email = emailArea.children[i].id;
      emailList.push(email);
    }
    const sendEmailResult = await encapsulateFetch('/namespace/invitePeople', {
      emailList: emailList,
      namespaceId: shouldUpdateNamespaceId,
      newDefaultRoomId: updateNamespaceResult.thisNamespaceDefaultRoomId,
      invitor: currentUser.name
    }, 'POST')
    if (sendEmailResult) {
      alert('邀請信送出成功');
    }
  }
})

// 點擊 namespace 區塊
namespacesArea.addEventListener('click', async function (e) {
  if (e.target.nodeName.toUpperCase() === 'INPUT') {
    const selectNamespaceArea = e.target.parentNode;
    const namespaceTitle = selectNamespaceArea.children[0].textContent;
    const namespaceIdStr = selectNamespaceArea.id;
    // 獲取被點擊的 namespaceId
    const beTappedNamespaceId = namespaceIdStr.replace('namespaceId_', '');
    switch (e.target.className) {
      case 'enter_namespace_btn':
        // 打 api 更新使用者最後點擊的 namespace 及該 namespace 綁定的 default general room
        await encapsulateFetch('/users/updateSelectedNamespace', {
          userId: currentUser.userId,
          newSelectedNamespaceId: beTappedNamespaceId
        }, 'PUT');
        window.location = `/chat?userId=${userId}&namespaceId=${beTappedNamespaceId}`;    
        break;
      case 'invite_from_namespace_block_btn':
        beSelectedNamespaceBlock = selectNamespaceArea
        isEditNamespaceMode = true;
        inputModalAppearance(isEditNamespaceMode, true, namespaceTitle);
        break;
    }
  }
}) 

function inputModalAppearance(isEditNamespaceMode, shouldShow, namespaceTitle) {
  const placeholder = isEditNamespaceMode ? 'Edit namespace' : 'create a namespace';
  document.querySelector('.namespace_input input').placeholder = placeholder;
  document.querySelector('.namespace_input input').value = namespaceTitle;
  const displayType = shouldShow ? 'block' : 'none';
  inputModal.style.display = displayType;
}