importScripts('js/idb.js', 'js/store.js', 'js/all.js');
var staticCacheName = "mws-s2";
var contentImgsCache = "mws-s2-images";
var allCaches = [staticCacheName, contentImgsCache];

/**
 * Install the service worker and cache static assets
 */
self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      return cache.addAll([
        "/",
        "restaurant.html",
        "css/styles.css",
        "js/moment.min.js",
        "js/idb.js",
        "js/store.js",
        "js/all.js",
        "js/main.js",
        "js/restaurant_info.js",
        "manifest.json"
      ]);
    })
  );
});

/**
 * Activate service worker and delete previous caches pertaining to this application
 * if they exist.
 */
self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function(cacheName) {
            return (
              cacheName.startsWith("mws-stage-1") &&
              !allCaches.includes(cacheName)
            );
          })
          .map(function(cacheName) {
            return caches.delete(cacheName);
          })
      );
    })
  );
});

/**
 * Hijack fetch requests to be handled by service worker.
 */
self.addEventListener("fetch", function(event) {
  var requestUrl = new URL(event.request.url);

  // if requests is for our own static files.
  if (requestUrl.origin === location.origin) {
    // When requesting restaurant.html the url contains params, we'll
    // strip the params to match restaurant.html and check if it's cached
    // if not, fall back to fetch from network.
    if (requestUrl.pathname.startsWith("/restaurant.html")) {
      event.respondWith(
        caches.match("/restaurant.html").then(function(response) {
          return response ? response : fetch(event.request).catch(err => console.log("failed to fetch, possibly offline: ", err));
        })
      );
    }

    // If request is for images, call on serveImage
    if (requestUrl.pathname.startsWith("/img/")) {
      event.respondWith(serveImage(event.request));
      return;
    }
    if (requestUrl.pathname.startsWith("/images/")) {
      event.respondWith(serveImage(event.request));
      return;
    }
  }

  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request).catch(err => console.log("failed to fetch, possibly offline: ", err));
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
      }).catch(err => console.log("failed to fetch, possibly offline: ", err));
    });
  });
}

/**
 * Background Sync
 * http://frontend.turing.io/lessons/module-4/background-sync.html
 * https://developers.google.com/web/updates/2015/12/background-sync
 * November 12th, 2018
 */
self.addEventListener('sync', function(event) {
  if (event.tag == 'offlineFavoriteSync') {
    event.waitUntil(onlinePushFavorite());
  } else if (event.tag == 'offlineReviewSync') {
    event.waitUntil(onlinePushReview());
  }
});

onlinePushReview = () => {
  // take from offline-reviews
  dbPromise
    .then(db => {
      return db
        .transaction("offline-reviews")
        .objectStore("offline-reviews")
        .getAll();
    })
    .then(allObjs => {
      if (allObjs.length > 0) {
        // we have offline reviews
        return Promise.all(allObjs.map( obj => {
          return fetch(`${DBHelper.DATABASE_URL}reviews`, {
            method: "POST",
            body: JSON.stringify(obj)
          })
          .then(response => {
            if(response.ok){
              console.log("review entry synced");
              dbPromise.then(db => {
                const tx = db.transaction("offline-reviews", "readwrite");
                tx.objectStore("offline-reviews").delete(obj.id);
                return tx.complete;
              });
            }
          })
          .catch(error => {
            console.log("onlinePushReview Error: ", error);
          });
        }));
      }
    })
    .catch(function(error) {
      const errorMsg = `Request failed. Returned status of ${error}`;
      console.log("onlinePushReview Error: ", errorMsg);
    });
}

onlinePushFavorite = () => {
  // take from offline-reviews
  dbPromise
    .then(db => {
      return db
        .transaction("offline-favorites")
        .objectStore("offline-favorites")
        .getAll();
    })
    .then(allObjs => {
      if (allObjs.length > 0) {
        // we have offline reviews
        return Promise.all(allObjs.map( obj => {
          fetch(obj.url, { method: "PUT" })
          .then(response => {
            if(response.ok){
              console.log("favorite entry synced");
              dbPromise.then(db => {
                const tx = db.transaction("offline-reviews", "readwrite");
                tx.objectStore("offline-reviews").delete(obj.id);
                return tx.complete;
              });
            }
          })
          .catch(error => {
            console.log("onlinePushReview Error: ", error);
          });
        }));
      }
    })
    .catch(function(error) {
      const errorMsg = `Request failed. Returned status of ${error}`;
      console.log("onlinePushReview Error: ", errorMsg);
    });
}

