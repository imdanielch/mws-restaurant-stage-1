let restaurant;
let reviews;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener("DOMContentLoaded", (event) => {
  restaurantInitMap();
});

/**
 * Initialize leaflet map
 */
restaurantInitMap = () => {
  restaurantFetchRestaurantFromURL((error, restaurant) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      // Instantiate map then generate breadcrumbs
      // if L is not defined, skip initiating map
      if (typeof L !== "undefined") {
        self.newMap = L.map("map", {
          center: [restaurant.latlng.lat, restaurant.latlng.lng],
          zoom: 16,
        });
        L.tileLayer(
          //"https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}",
          //"https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}",
          "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}",
          {
            accessToken: mapboxToken,
            maxZoom: 18,
            tileSize: 256,
            attribution:
              'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
              '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
              'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            id: "mapbox/streets-v11",
          }
        ).addTo(newMap);
        DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
      } else {
        // display a warning saying that the maps can't be shown.
        const map = document.getElementById("map");
        map.innerHTML = `<div class="warning-title">Warning!</div>
        <div class="warning-message">Maps can't be loaded, are we offline?</div>`;
      }

      restaurantFillBreadcrumb();
      restaurantFillRestaurantIdForm();
    }
  });
};

/* window.restaurantInitMap = () => {
  restaurantFetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      restaurantFillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} */

/**
 * Get current restaurant from page URL.
 */
restaurantFetchRestaurantFromURL = (callback) => {
  if (self.restaurant) {
    // restaurant already fetched!
    if (typeof callback === "function") {
      callback(null, self.restaurant);
    }
    return;
  }
  const id = restaurantGetParameterByName("id");
  if (!id) {
    // no id found in URL
    error = "No restaurant id in URL";
    callback(error, null);
  } else {
    // Fetch for restaurant info and then fill restaurant HTML
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      restaurantFillRestaurantHTML();
      callback(null, restaurant);
    }).then(() => {
      // Fetch restaurant reviews and then fill restaurant HTML for reviews.
      DBHelper.fetchRestaurantReviewsById(id, (error, reviews) => {
        self.reviews = reviews;
        if (!self.reviews) {
          console.error(error);
          return;
        }
        // fill reviews
        restaurantFillReviewsHTML();
      });
    });
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
restaurantFillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById("restaurant-name");
  name.innerHTML = restaurant.name;
  // Fill in favorite button
  const favBtn = generateFavButton(restaurant);
  name.appendChild(favBtn);

  const address = document.getElementById("restaurant-address");
  address.innerHTML = restaurant.address;

  const image = document.getElementById("restaurant-img");
  image.className = "restaurant-img";
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = `Image representation of the restaurant ${restaurant.name}`;

  const cuisine = document.getElementById("restaurant-cuisine");
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    restaurantFillRestaurantHoursHTML();
  }
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
restaurantFillRestaurantHoursHTML = (
  operatingHours = self.restaurant.operating_hours
) => {
  const hours = document.getElementById("restaurant-hours");
  for (let key in operatingHours) {
    const row = document.createElement("tr");

    const day = document.createElement("td");
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement("td");
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
restaurantFillReviewsHTML = (reviews = self.reviews) => {
  const container = document.getElementById("reviews-container");
  container.innerHTML = `<ul id="reviews-list"></ul>`;
  const title = document.createElement("h3");
  title.innerHTML = "Reviews";
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement("p");
    noReviews.innerHTML = "No reviews yet!";
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById("reviews-list");
  reviews.forEach((review) => {
    ul.appendChild(restaurantCreateReviewHTML(review));
  });
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
restaurantCreateReviewHTML = (review) => {
  const li = document.createElement("li");
  const name = document.createElement("p");
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement("p");
  if (review.updatedAt) {
    date.innerHTML =
      typeof review.updatedAt === "number"
        ? moment.unix(review.updatedAt / 1000).format("MMM Do, YYYY")
        : moment(review.updatedAt).format("MMM Do, YYYY");
  } else {
    date.innerHTML = "Offline Mode";
  }
  li.appendChild(date);

  const rating = document.createElement("p");
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement("p");
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
restaurantFillBreadcrumb = (restaurant = self.restaurant) => {
  // Fill in current page's breadcrumb and make it a link, also give it aria-currentA
  // https://www.w3.org/TR/wai-aria-practices/examples/breadcrumb/index.html
  const breadcrumb = document.getElementById("breadcrumb");
  const li = document.createElement("li");
  const a = document.createElement("a");
  a.setAttribute("aria-current", "page");
  a.innerHTML = restaurant.name;
  a.setAttribute("href", window.location.href);
  li.appendChild(a);
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
restaurantGetParameterByName = (name, url) => {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
};

restaurantFillRestaurantIdForm = () => {
  if (this.restaurant) {
    const inputRestaurantId = document.getElementById("restaurant_id");
    inputRestaurantId.value = this.restaurant.id;
  }
};

/**
 * Start submit process when the submit button is activated.
 * gather form data, evaluate validity, submit if valid.
 */
onSubmitReview = (e) => {
  // stop default behavior
  e.preventDefault();

  const form = document.getElementById("review-form");
  if (errorHandleReview(form)) {
    const formData = {
      restaurant_id: Number(form.restaurant_id.value),
      name: form.name.value,
      rating: Number(form.rating.value),
      comments: form.comments.value || "",
    };
    submitFormData(formData);
  }
};

/**
 * Evaluate form data
 * return {Boolean}
 */
errorHandleReview = (data) => {
  // wipe all alerts.
  const alerts = document.getElementsByClassName("alert");
  while (alerts[0]) {
    alerts[0].parentNode.removeChild(alerts[0]);
  }
  // if restaurant_id is empty
  if (!data.restaurant_id.value) {
    // handle error
    return false;
  }
  // if name is empty
  if (!data.name.value) {
    // handle error
    console.log("missing name");
    const alert = document.createElement("span");
    alert.setAttribute("class", "alert");
    alert.setAttribute("role", "alert");
    alert.innerHTML = "Name is a required field";

    const name = document.getElementById("name");
    // Insert alert after the input field
    name.parentNode.insertBefore(alert, name.nextSibling);
    // focus on missing field
    name.focus();
    return false;
  }
  // if rating is empty
  if (!data.rating.value) {
    // handle error
    console.log("missing rating");
    const alert = document.createElement("span");
    alert.setAttribute("class", "alert");
    alert.setAttribute("role", "alert");
    alert.innerHTML = "Selecting a rating is required";

    const rating = document.getElementById("rating-radiogroup");
    // Insert alert after the input field
    rating.parentNode.insertBefore(alert, rating.nextSibling);
    // focus on missing field
    rating.focus();
    return false;
  }
  return true;
};

/**
 * Submit review
 * attempt fetch post, if it succeeds, trigger fetch for review list
 * if fetch post fails, save to indexedDB 'pending' until internet connection reestablishes
 */
submitFormData = (data) => {
  console.log("url: ", `${DBHelper.DATABASE_URL}reviews`);
  console.log("packet: ", data);
  return fetch(`${DBHelper.DATABASE_URL}reviews`, {
    method: "POST",
    body: JSON.stringify(data),
  })
    .then(function (response) {
      if (response.status >= 200 && response.status < 300) {
        console.log(response.status);
        console.log(response.statusText);
        // call fetch for reviews and repopulate reviews HTML
        DBHelper.fetchRestaurantReviewsById(
          data.restaurant_id,
          (error, reviews) => {
            self.reviews = reviews;
            if (!self.reviews) {
              console.error(error);
              return;
            }
            // fill reviews
            restaurantFillReviewsHTML();
          }
        );
      } else {
        // Server error.
        console.log(response.status);
        console.log(response.statusText);
      }
    })
    .catch(function (error) {
      console.log("submitFormData error catch");
      // POST failed, save to indexedDB 'offline-reviews'
      dbPromise
        .then((db) => {
          const tx = db.transaction("offline-reviews", "readwrite");
          tx.objectStore("offline-reviews").put(data);
          return tx.complete;
        })
        .then(() => {
          console.log("offline review put in idb");
          // https://developers.google.com/web/updates/2015/12/background-sync
          // register sync with service worker
          navigator.serviceWorker.ready.then(function (registration) {
            console.log("sync register offline review");
            return registration.sync.register("offlineReviewSync");
          });
          // reload page to show the new entry.
          // can improve by using JS to append entry to end of page.
          document.getElementById("review-form").reset();
          DBHelper.fetchRestaurantReviewsById(
            data.restaurant_id,
            (error, reviews) => {
              self.reviews = reviews;
              if (!self.reviews) {
                console.error(error);
                return;
              }
              // fill reviews
              restaurantFillReviewsHTML();
            }
          );
        });
    });
};

handleOffline = () => {};
