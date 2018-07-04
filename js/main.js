/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener("DOMContentLoaded", event => {
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) {
      // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById("neighborhoods-select");
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement("option");
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById("cuisines-select");

  cuisines.forEach(cuisine => {
    const option = document.createElement("option");
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById("map"), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
};

/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
  const cSelect = document.getElementById("cuisines-select");
  const nSelect = document.getElementById("neighborhoods-select");

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(
    cuisine,
    neighborhood,
    (error, restaurants) => {
      if (error) {
        // Got an error!
        console.error(error);
      } else {
        resetRestaurants(restaurants);
        fillRestaurantsHTML();
      }
    }
  );
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = restaurants => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById("restaurants-list");
  ul.innerHTML = "";

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById("restaurants-list");
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addLazyLoading();
  addMarkersToMap();
  handleStarFavourite();
};

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = restaurant => {
  const li = document.createElement("li");
  const image = document.createElement("img");

  image.className = "restaurant-img";
  image.classList.add("lazy-loading");
  image.alt = `Restaurant ${restaurant.name}`;
  image.src = DBHelper.smImageUrlForRestaurant(restaurant);
  image.setAttribute("data-src", DBHelper.mdImageUrlForRestaurant(restaurant));
  li.append(image);

  const name = document.createElement("h2");
  name.innerHTML = restaurant.name;

  // Favourite Star
  const favouriteContainer = document.createElement("div");
  favouriteContainer.classList.add("favourite-star--container");

  const favouriteStar = document.createElement("span");
  favouriteStar.classList.add("favourite-star");
  favouriteStar.classList.add("icon-star-empty");
  favouriteStar.setAttribute("role", "button");
  favouriteStar.setAttribute("aria-label", "rating star");
  favouriteStar.setAttribute("title", "press a star to rate");
  favouriteStar.setAttribute("res-id", restaurant.id);

  if (restaurant.is_favorite === "true" || restaurant.is_favorite === true) {
    favouriteStar.classList.add("icon-star-full");
  }

  favouriteContainer.appendChild(name);
  favouriteContainer.appendChild(favouriteStar);
  li.append(favouriteContainer);

  // Neighborhood
  const neighborhood = document.createElement("p");
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement("p");
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement("a");
  more.classList.add("btn");
  more.classList.add("btn--primary");
  more.innerHTML = "View Details";
  more.setAttribute("aria-label", "View Details for " + restaurant.name);
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more);

  return li;
};

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, "click", () => {
      window.location.href = marker.url;
    });
    self.markers.push(marker);
  });
};

const handleStarFavourite = () => {
  const stars = document.querySelectorAll(".favourite-star");

  stars.forEach(star => {
    star.addEventListener("click", () => {
      star.classList.toggle("icon-star-full");
      const restaurantId = star.getAttribute("res-id");

      if (star.classList.contains("icon-star-full")) {
        DBHelper.toggleFavorite(restaurantId, true);
      } else {
        DBHelper.toggleFavorite(restaurantId, false);
      }
    });
  });
};

const addLazyLoading = () => {
  const images = document.querySelectorAll(".lazy-loading");
  const config = {
    // If the image gets within 50px in the Y axis, start the download.
    rootMargin: "50px 0px",
    threshold: 0.01
  };

  const handleIntersection = (entries, observer) => {
    entries.forEach(entry => {
      if (entry.intersectionRatio > 0) {
        loadImage(entry.target);
      }
    });
  };

  const loadImage = image => {
    const src = image.dataset.src;
    fetchImage(src).then(() => {
      image.src = src;
    });
  };

  const fetchImage = url => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.src = url;
      image.onload = resolve;
      image.onerror = reject;
    });
  };

  // The observer for the images on the page
  const observer = new IntersectionObserver(handleIntersection, config);
  images.forEach(image => {
    observer.observe(image);
  });
};
