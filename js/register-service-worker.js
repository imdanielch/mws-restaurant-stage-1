// If browser supports service workers, register service worker.
if (navigator.serviceWorker) {

  // Make sure the page has loaded before registering service worker
  window.addEventListener('load', function() {

    navigator.serviceWorker.register('/sw.js').then(function(registration) {
      console.log("Service worker registration successful!")
    }, function(error) {
      console.log("Unable to register service worker\n", error);
    });
  });
}
