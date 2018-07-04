self.addEventListener("install", event => {
  // Perform install steps
});
const CACHE_NAME = "restaurant-cache";
const urlsToCache = [
  "./index.html",
  "./restaurant.html",
  "./dist/css/style.min.css",
  "./dist/js/main.min.js",
  "./dist/js/restaurant_info.min.js"
];

self.addEventListener("install", event => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(currentCacheName => {
          if (currentCacheName !== CACHE_NAME) {
            caches.delete(currentCacheName);
          }
        })
      );
    })
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches
      .open(CACHE_NAME)
      .then(cache => {
        return cache.match(event.request).then(response => {
          return response || fetch(event.request);
        });
      })
      .catch(err => console.log("Error: Service worker fetch failed: ", err))
  );
});
