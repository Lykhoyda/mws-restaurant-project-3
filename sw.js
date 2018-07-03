self.addEventListener("install", function(event) {
  // Perform install steps
});
var CACHE_NAME = "restaurant-cache";
var urlsToCache = [
  "./",
  "./index.html",
  "./restaurant.html",
  "./css/styles.css",
  "./js/dbhelper.js",
  "./js/main.js",
  "./js/restaurant_info.js",
  "./lib/idb.js",
  "./img/1.jpg",
  "./img/2.jpg",
  "./img/3.jpg",
  "./img/4.jpg",
  "./img/5.jpg",
  "./img/6.jpg",
  "./img/7.jpg",
  "./img/8.jpg",
  "./img/9.jpg",
  "./img/10.jpg"
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
