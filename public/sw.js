const CACHE_NAME = 'himart-quote-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // 간단한 캐시-우선 전략(캐시 없으면 네트워크 패치)
  // 가장 기본적인 PWA 요구사항을 충족하기 위한 빈 fetch 이벤트 리스너여도 충분함.
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
