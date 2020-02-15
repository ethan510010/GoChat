function showCustomConfirmDialog(title) {
  const customDlg = document.getElementById('dialogCont');
  customDlg.style.top = '30%';
  customDlg.style.opacity = 1;
  const diaMessage = title;
  const dialogBody = document.getElementById('dlogBody');
  dialogBody.textContent = diaMessage;
  document.getElementById('freezeLayer').style.display = '';
}

function customDialogConfirmClicked(callback) {
  const acceptBtn = document.getElementById('dlg_accept_btn');
  acceptBtn.addEventListener('click', function() {
    callback();
    closeCustomConfirmWindow();
  })
}

function customDialogCancelClicked(callback) {
  const cancel = document.getElementById('dlg_cancel_btn');
  cancel.addEventListener('click', function() {
    callback();
    closeCustomConfirmWindow();
  })
}

function closeCustomConfirmWindow() {
  const dialog = document.getElementById('dialogCont');
  dialog.style.top = '-30%';
  dialog.style.opacity = 0;
  document.getElementById('freezeLayer').style.display = 'none';
}