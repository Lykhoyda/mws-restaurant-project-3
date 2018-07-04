/**
 * Common database helper functions.
 */

const DB_NAME = "restaurantsDB";
const isChrome =
  /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
class DBHelper {
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    // static path:`http://localhost:${port}/data/restaurants.json`;
    return `http://localhost:${port}`;
  }

  static openIDB() {
    if (!navigator.serviceWorker) {
      return Promise.resolve();
    }

    return idb.open(DB_NAME, 1, upgradeDB => {
      const store = upgradeDB.createObjectStore(DB_NAME, {
        keyPath: "id"
      });
      store.createIndex("by-id", "id");
      upgradeDB.createObjectStore("pending-reviews", { keyPath: "random_id" });
      upgradeDB.createObjectStore("reviews", { keyPath: "id" });
    });
  }

  static saveToIDB(data) {
    return DBHelper.openIDB()
      .then(db => {
        if (!db) return;

        const tx = db.transaction(DB_NAME, "readwrite");
        const store = tx.objectStore(DB_NAME);
        data.forEach(restaurant => {
          store.put(restaurant);
        });

        return tx.complete;
      })
      .catch(err => {
        console.log("DB open failed", err);
      });
  }

  static getCachedRestaurants() {
    return DBHelper.openIDB().then(db => {
      if (!db) return;

      const store = db.transaction(DB_NAME).objectStore(DB_NAME);
      return store.getAll();
    });
  }

  static fetchRestaurants() {
    return fetch(`${DBHelper.DATABASE_URL}/restaurants`)
      .then(res => res.json())
      .then(restaurants => {
        DBHelper.saveToIDB(restaurants);
        return restaurants;
      })
      .catch(err => {
        const error = `Request failed. Returned status of ${err}`;
        throw error;
      });
  }

  /**
   * Fetch all restaurants.
   */
  static getRestaurants(callback) {
    return DBHelper.getCachedRestaurants()
      .then(restaurants => {
        if (restaurants.length) {
          return Promise.resolve(restaurants);
        } else {
          return DBHelper.fetchRestaurants();
        }
      })
      .then(restaurants => {
        callback(null, restaurants);
      })
      .catch(error => {
        callback(error, null);
      });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.getRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) {
          // Got the restaurant
          callback(null, restaurant);
        } else {
          // Restaurant does not exist in the database
          callback("Restaurant does not exist", null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.getRestaurants((error, restaurants) => {
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
    DBHelper.getRestaurants((error, restaurants) => {
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
    DBHelper.getRestaurants((error, restaurants) => {
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
    DBHelper.getRestaurants((error, restaurants) => {
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
    DBHelper.getRestaurants((error, restaurants) => {
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

  static mdImageUrlForRestaurant(restaurant) {
    return isChrome
      ? `./dist/img/${restaurant.id}-md.webp`
      : `./dist/img/${restaurant.id}-md.jpg`;
  }

  static smImageUrlForRestaurant(restaurant) {
    return isChrome
      ? `./dist/img/${restaurant.id}-sm.webp`
      : `./dist/img/${restaurant.id}-sm.jpg`;
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP
    });
    return marker;
  }

  /**
   * Toggle restaurant favorite
   */
  static toggleFavorite(restaurantId, isFavorite) {
    fetch(
      `${
        DBHelper.DATABASE_URL
      }/restaurants/${restaurantId}/?is_favorite=${isFavorite}`,
      {
        method: "put",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        }
      }
    ).catch(() => {
      const dbOpen = DBHelper.openIDB();

      dbOpen
        .then(db => {
          if (!db) return;

          const tx = db.transaction(DB_NAME, "readwrite");
          const store = tx.objectStore(DB_NAME);

          return store.getAll();
        })
        .then(restaurants => {
          const restaurant = restaurants.filter(
            restaurant => restaurant.id == restaurantId
          )[0];

          restaurant.is_favorite = isFavorite;
          restaurant.is_favorite_pending = true;

          dbOpen.then(db => {
            if (!db) return;
            const tx = db.transaction(DB_NAME, "readwrite");
            const store = tx.objectStore(DB_NAME);
            store.put(restaurant);

            return tx.complete;
          });
        });
    });
  }

  static storeReview(newReview, callback) {
    const dbPromise = DBHelper.openIDB();

    fetch(`${DBHelper.DATABASE_URL}/reviews/`, {
      method: "post",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        restaurant_id: newReview.restaurantId,
        name: newReview.name,
        rating: newReview.rating,
        comments: newReview.comments
      })
    })
      .then(response => response.json())
      .then(review => {
        dbPromise
          .then(db => {
            if (!db) return;

            const tx = db.transaction("reviews", "readwrite");
            const store = tx.objectStore("reviews");

            store.put(review);

            if (review.hasOwnProperty("random_id")) {
              DBHelper.deletePendingReviewFromIdb(review);
            }

            tx.complete;

            return review;
          })
          .then(review => {
            callback(review);
          });
      })
      .catch(() => {
        dbPromise
          .then(db => {
            if (!db) return;

            const tx = db.transaction("pending-reviews", "readwrite");
            const store = tx.objectStore("pending-reviews");

            newReview.random_id = DBHelper.generateRandomId();

            store.put(newReview);

            tx.complete;

            return newReview;
          })
          .then(review => {
            callback(review);
          });
      });
  }

  static submitRestaurantPendingFavorites(restaurant) {
    fetch(
      `${DBHelper.DATABASE_URL}/restaurants/${restaurant.id}/?is_favorite=${
        restaurant.is_favorite
      }`,
      {
        method: "put",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        }
      }
    ).then(response => {
      const dbPromise = DBHelper.openIDB();

      dbPromise.then(db => {
        if (!db) return;
        const tx = db.transaction(DB_NAME, "readwrite");
        const store = tx.objectStore(DB_NAME);

        restaurant.is_favorite_pending = false;
        store.put(restaurant);

        return tx.complete;
      });
    });
  }

  /**
   * Fetch reviews for a restaurant
   */
  static fetchReviewsByRestaurantId(restaurant, callback) {
    const dbPromise = DBHelper.openIDB();

    fetch(`${DBHelper.DATABASE_URL}/reviews?restaurant_id=${restaurant.id}`)
      .then(response => response.json())
      .then(reviews => {
        dbPromise
          .then(db => {
            if (!db) return;

            const tx = db.transaction("reviews", "readwrite");
            const store = tx.objectStore("reviews");

            reviews.forEach(review => {
              store.put(review);
            });

            restaurant.reviews = reviews;

            return tx.complete;
          })
          .then(() => {
            callback();
          });
      })
      .catch(e => {
        dbPromise
          .then(db => {
            if (!db) return;
            const tx = db.transaction("reviews", "readwrite");
            const store = tx.objectStore("reviews");

            return store.getAll();
          })
          .then(reviews => {
            const restaurantReviews = reviews.filter(
              review => review.restaurant_id == restaurant.id
            );
            restaurant.reviews = restaurantReviews;

            dbPromise
              .then(db => {
                if (!db) return;
                const tx = db.transaction("pending-reviews", "readwrite");
                const store = tx.objectStore("pending-reviews");

                return store.getAll();
              })
              .then(pendingReviews => {
                const pendingRestaurantReviews = pendingReviews.filter(
                  review => {
                    return review.restaurantId == restaurant.id;
                  }
                );

                restaurant.reviews.push(...pendingRestaurantReviews);
              })
              .then(() => {
                callback();
              });
          });
      });
  }

  static deletePendingReviewFromIdb(review) {
    const dbPromise = DBHelper.openIDB();

    dbPromise.then(db => {
      if (!db) return;
      const tx = db.transaction("pending-reviews", "readwrite");
      const store = tx.objectStore("pending-reviews");

      store.delete(review.random_id);

      return tx.complete;
    });
  }

  static generateRandomId() {
    return (
      "_" +
      Math.random()
        .toString(24)
        .substr(2, 9)
    );
  }
}
