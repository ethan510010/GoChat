const socket = io(`/namespaceId=${currentNamespaceId}`);
// restful api 拿取必要資訊
function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}