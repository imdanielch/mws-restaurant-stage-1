var staticCacheName = 'mws-s2';
var contentImgsCache = 'mws-s2-images';
var allCaches = [
  staticCacheName,
  contentImgsCache
];

/**
 * Install the service worker and cache static assets
 */
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      return cache.addAll([
        '/',
        'restaurant.html',
        'css/styles.css',
        'js/idb.js',
        'js/store.js',
        'js/all.js',
        'js/main.js',
        'js/restaurant_info.js',
        'manifest.json'
      ]);
    })
  );
});

/**
 * Activate service worker and delete previous caches pertaining to this application
 * if they exist.
 */
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName.startsWith('mws-stage-1') &&
                 !allCaches.includes(cacheName);
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

/**
 * Hijack fetch requests to be handled by service worker.
 */
self.addEventListener('fetch', function(event) {
  var requestUrl = new URL(event.request.url);

  // if requests is for our own static files.
  if (requestUrl.origin === location.origin) {
    // When requesting restaurant.html the url contains params, we'll
    // strip the params to match restaurant.html and check if it's cached
    // if not, fall back to fetch from network.
    if (requestUrl.pathname.startsWith('/restaurant.html')) {
      event.respondWith(caches.match('/restaurant.html').then(function(response){
        return (response
          ? response
          : fetch(event.request));
          })
      );
    }

    // If request is for images, call on serveImage
    if (requestUrl.pathname.startsWith('/img/')) {
      event.respondWith(serveImage(event.request));
      return;
    }
    if (requestUrl.pathname.startsWith('/images/')) {
      event.respondWith(serveImage(event.request));
      return;
    }
  }

  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});

/**
 * Get images from images cache.
 */
function serveImage(request) {
  var storageUrl = request.url;

  return caches.open(contentImgsCache).then(function(cache) {
    return cache.match(storageUrl).then(function(response) {
      // If cache found, return it.
      if (response) return response;

      // If there's no cache, fetch from network, cache a clone of the file
      // and return the network response.
      return fetch(request).then(function(networkResponse) {
        cache.put(storageUrl, networkResponse.clone());
        return networkResponse;
      });
    });
  });
}
