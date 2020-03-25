socket.on('customError', (error) => {
  if (error.statusCode === 500) {
    showCustomAlert('Server error');
  }
});
