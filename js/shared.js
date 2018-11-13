toggleFav = (e, callback) => {
  //console.log(e.target.dataset.id);
  //console.log(e.target);
  const favBool = e.target.getAttribute("aria-pressed") == "true";
  const url = `http://localhost:1337/restaurants/${
    e.target.dataset.id
  }/?is_favorite=${!favBool}`;
  fetch(url, { method: "PUT" })
    .then(response => {
      if (response.status >= 200 && response.status < 300) {
        e.target.setAttribute("aria-pressed", (!favBool).toString());
        e.target.blur();
        if (typeof callback === "function") {
          callback();
        }
      }
    })
    .then(function() {
      // update idb restaurants entry
      console.log("update idb favorite entry");
      return dbPromise
        .then(async db => {
          const tx = db.transaction("restaurants", "readwrite");
          const store = tx.objectStore("restaurants");
          const obj = await store.get(Number(e.target.dataset.id));
          obj.is_favorite = !favBool;
          obj.updatedAt = moment.now();

          store.put(obj);
          return tx.complete;
        })
        .catch(function(err) {
          console.log(err);
        });
    })
    .catch(function(error) {
      // failed to fetch, maybe offline?
      // fetch post failed, save to indexedDB 'offline-favorites'
      const data = {
        url: url
      };
      // update idb restaurants entry
      dbPromise
        .then(async db => {
          const tx = db.transaction("restaurants", "readwrite");
          const store = tx.objectStore("restaurants");
          const obj = await store.get(Number(e.target.dataset.id));
          obj.is_favorite = !favBool;
          obj.updatedAt = moment.now();

          store.put(obj);
          return tx.complete;
        })
        .then(res => {
          console.log("toggle aria-pressed to ", (!favBool).toString());
          e.target.setAttribute("aria-pressed", (!favBool).toString());
          e.target.blur();
        })
        .catch(function(err) {
          console.log(err);
        });
      // save to offline-favorites
      dbPromise
        .then(db => {
          const tx = db.transaction("offline-favorites", "readwrite");
          tx.objectStore("offline-favorites").put(data);
          return tx.complete;
        })
        .then(() => {
          // https://developers.google.com/web/updates/2015/12/background-sync
          // register sync with service worker
          console.log("reg sync favorites");
          navigator.serviceWorker.ready.then(function(registration) {
            return registration.sync.register("offlineFavoriteSync");
          });
        });
    });
};

generateFavButton = (restaurant, callback) => {
  const favBtn = document.createElement("button");
  favBtn.setAttribute("class", "fav");
  favBtn.dataset.id = restaurant.id;
  favBtn.setAttribute("onclick", `toggleFav(event, ${callback})`);
  favBtn.setAttribute("onKeyPress", `toggleFav(event, ${callback})`);
  let favBool;
  if (restaurant.is_favorite) {
    favBool = restaurant.is_favorite.toString() == "true";
  } else {
    favBool = false;
  }
  if (favBool) {
    favBtn.setAttribute("aria-pressed", "true");
    favBtn.setAttribute(
      "aria-label",
      `Remove ${restaurant.name} from my favorites`
    );
  } else {
    favBtn.setAttribute("aria-pressed", "false");
    favBtn.setAttribute("aria-label", `Add ${restaurant.name} to my favorites`);
  }
  //favBtn.innerHTML = "♡"
  favBtn.innerHTML = "♥";
  return favBtn;
};
