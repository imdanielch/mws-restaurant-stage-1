let restaurant;
let reviews;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener("DOMContentLoaded", event => {
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
          scrollWheelZoom: false
        });
        L.tileLayer(
          "https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}",
          {
            mapboxToken: mapboxToken,
            maxZoom: 18,
            attribution:
              'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
              '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
              'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            id: "mapbox.streets"
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
restaurantFetchRestaurantFromURL = callback => {
  if (self.restaurant) {
    // restaurant already fetched!
    callback(null, self.restaurant);
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
    });
    // Fetch restaurant reviews and then fill restaurant HTML for reviews.
    DBHelper.fetchRestaurantReviewsById(id, (error, reviews) => {
      self.reviews = reviews;
      if (!self.reviews) {
        console.error(error);
        return;
      }
      // fill reviews
      RestaurantFillReviewsHTML();
    });
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
restaurantFillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById("restaurant-name");
  name.innerHTML = restaurant.name;

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
RestaurantFillReviewsHTML = (reviews = self.reviews) => {
  const container = document.getElementById("reviews-container");
  const title = document.createElement("h2");
  title.innerHTML = "Reviews";
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement("p");
    noReviews.innerHTML = "No reviews yet!";
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById("reviews-list");
  reviews.forEach(review => {
    ul.appendChild(restaurantCreateReviewHTML(review));
  });
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
restaurantCreateReviewHTML = review => {
  const li = document.createElement("li");
  const name = document.createElement("p");
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement("p");
  date.innerHTML = moment
    .unix(review.updatedAt / 1000)
    .format("MMM Do, YYYY h:mm:ss A");
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
