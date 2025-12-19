// 清理 Service Worker 的脚本
// 在浏览器控制台中运行此脚本来清理 Service Worker

console.log('开始清理 Service Worker...');

// 1. 取消注册所有 Service Workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (let registration of registrations) {
      console.log('取消注册 Service Worker:', registration.scope);
      registration.unregister();
    }
  });
}

// 2. 清理所有缓存
if ('caches' in window) {
  caches.keys().then(cacheNames => {
    return Promise.all(
      cacheNames.map(cacheName => {
        console.log('删除缓存:', cacheName);
        return caches.delete(cacheName);
      })
    );
  }).then(() => {
    console.log('所有缓存已清理');
  });
}

console.log('Service Worker 清理完成！请刷新页面。');