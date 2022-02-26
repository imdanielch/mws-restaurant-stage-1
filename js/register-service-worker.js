// If browser supports service workers, register service worker.
if (navigator.serviceWorker) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("/sw.js").then(
      function (registration) {
        console.log("Service worker registration successful!");
      },
      function (error) {
        console.log("Unable to register service worker\n", error);
      }
    );
  });
}
