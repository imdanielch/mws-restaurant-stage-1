/**
 * Common database helper functions.
 */
class DBHelper {
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    // try to get from network, if that fails, get from indexDB
    // reason is if there's more data remotely and some data on indexDB
    // you'd only get local data and never update.
    return dbPromise
      .then(db => {
        return db
          .transaction("restaurants")
          .objectStore("restaurants")
          .getAll();
      })
      .then(allObjs => {
        if (allObjs.length > 0) {
          return callback(null, allObjs);
        }
      })
      .then(e => {
        // update idb with data from network if available.
        fetch(`${DBHelper.DATABASE_URL}restaurants`, {
          method: "GET"
        })
          .then(function(response) {
            return response.status === 200 ? response.json() : response;
          })
          .then(function(json) {
            json.map(data => {
              dbPromise.then(db => {
                const tx = db.transaction("restaurants", "readwrite");
                tx.objectStore("restaurants").put(data);
                return tx.complete;
              });
            });
            return callback(null, json);
          })
          .catch(function(error) {
            const errorMsg = `Request failed. Returned status of ${error}`;
            return callback(errorMsg, null);
          });
      })
      .catch(function(error) {
        // if idb fails, try getting from network.
        fetch(`${DBHelper.DATABASE_URL}restaurants`, {
          method: "GET"
        })
          .then(function(response) {
            return response.status === 200 ? response.json() : response;
          })
          .then(function(json) {
            json.map(data => {
              dbPromise.then(db => {
                const tx = db.transaction("restaurants", "readwrite");
                tx.objectStore("restaurants").put(data);
                return tx.complete;
              });
            });
            return callback(null, json);
          })
          .catch(function(error) {
            const errorMsg = `Request failed. Returned status of ${error}`;
            return callback(errorMsg, null);
          });
      });
  }

  /**
   * Fetch a restaurant by its ID. Try fetch from network, if it fails, get from indexedDB
   */
  static fetchRestaurantById(id, callback) {
    return dbPromise
      .then(db => {
        return db
          .transaction("restaurants")
          .objectStore("restaurants")
          .get(Number(id));
      })
      .then(obj => {
        if (obj) {
          return callback(null, obj);
        } else {
          // update from network
          fetch(`${DBHelper.DATABASE_URL}restaurants/${id}`, {
            method: "GET"
          })
            .then(function(response) {
              return response.status === 200 ? response.json() : response;
            })
            .then(function(json) {
              // save to store
              dbPromise.then(db => {
                const tx = db.transaction("restaurants", "readwrite");
                tx.objectStore("restaurants").put(json);
                return tx.complete;
              });
              return callback(null, json);
            })
            .catch(function(error) {
              callback("Restaurant does not exist", null);
            });
        }
      })
      .then(() => {})
      .catch(function(err) {
        // update from network
        fetch(`${DBHelper.DATABASE_URL}restaurants/${id}`, {
          method: "GET"
        })
          .then(function(response) {
            return response.status === 200 ? response.json() : response;
          })
          .then(function(json) {
            // save to store
            dbPromise.then(db => {
              const tx = db.transaction("restaurants", "readwrite");
              tx.objectStore("restaurants").put(json);
              return tx.complete;
            });
            return callback(null, json);
          })
          .catch(function(error) {
            callback("Restaurant does not exist", null);
          });
      });
  }

  /**
   * Fetch a restaurant reviews by its ID.
   * URL: http://localhost:1337/reviews/?restaurant_id=<restaurant_id>
   * fetch, if there's reviews, add to idb, then pull data from idb to return to callback
   * if fetch fails, pull current data from idb.
   */
  static fetchRestaurantReviewsById(id, callback) {
    // fetch network for new stuff and put into idb
    fetch(`${DBHelper.DATABASE_URL}reviews/?restaurant_id=${id}`, {
      method: "GET"
    })
      .then(function(response) {
        return response.status === 200 ? response.json() : response;
      })
      .then(function(json) {
        // save to store
        dbPromise.then(db => {
          const tx = db.transaction("reviews", "readwrite");
          // Should return array, so step through and put them in individually.
          if (Array.isArray(json)) {
            json.map(review => {
              return tx.objectStore("reviews").put(review);
            });
          }
          return tx.complete;
        });
        return json;
      })
      .then(function(json) {
        // get data from idb
        return dbPromise.then(async db => {
          const tx = db.transaction(
            ["reviews", "offline-reviews"],
            "readwrite"
          );
          const store1 = tx.objectStore("reviews").index("restaurant_id");
          const store2 = tx
            .objectStore("offline-reviews")
            .index("restaurant_id");
          const obj1 = await store1.getAll(Number(id));
          const obj2 = await store2.getAll(Number(id));
          // If no reviews in indexedDB, try fetching.
          const mergedObj = obj1.concat(obj2);
          return callback(null, mergedObj);
        });
      })
      .catch(function(error) {
        console.log(error);
        return dbPromise.then(async db => {
          const tx = db.transaction(
            ["reviews", "offline-reviews"],
            "readwrite"
          );
          const store1 = tx.objectStore("reviews").index("restaurant_id");
          const store2 = tx
            .objectStore("offline-reviews")
            .index("restaurant_id");
          const obj1 = await store1.getAll(Number(id));
          const obj2 = await store2.getAll(Number(id));
          // If no reviews in indexedDB, try fetching.
          const mergedObj = obj1.concat(obj2);
          console.log(mergedObj);
          return callback(null, mergedObj);
        });
      });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(
    cuisine,
    neighborhood,
    callback
  ) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != "all") {
          // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != "all") {
          // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map(
          (v, i) => restaurants[i].neighborhood
        );
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter(
          (v, i) => neighborhoods.indexOf(v) == i
        );
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter(
          (v, i) => cuisines.indexOf(v) == i
        );
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return `./restaurant.html?id=${restaurant.id}`;
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    // if the field doesn't exist, return undefined for error handling.
    return `/img/${
      restaurant.photograph ? restaurant.photograph : restaurant.id
    }.jpg`;
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = new L.marker(
      [restaurant.latlng.lat, restaurant.latlng.lng],
      {
        title: restaurant.name,
        alt: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant)
      }
    );
    marker.addTo(newMap);
    return marker;
  }
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */
}
