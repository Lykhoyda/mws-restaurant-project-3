if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").then(
      registration => {
        console.log(
          "ServiceWorker registration successful with scope: ",
          registration.scope
        );
      },
      err => {
        console.log("ServiceWorker registration failed: ", err);
      }
    );
  });
}

const checkPendingReviews = () => {
  const dbPromise = DBHelper.openIDB();
  dbPromise
    .then(db => {
      if (!db) return;
      const tx = db.transaction("pending-reviews", "readwrite");
      const store = tx.objectStore("pending-reviews");
      return store.getAll();
    })
    .then(pendingReviews => {
      pendingReviews.forEach(review => {
        DBHelper.deletePendingReviewFromIdb(review);
        DBHelper.storeReview(review, review => {
          console.log("submiting pending reviews");
        });
      });
    });
};

const checkPendingFavorites = () => {
  const dbPromise = DBHelper.openIDB();
  dbPromise
    .then(db => {
      if (!db) return;
      const tx = db.transaction(DB_NAME, "readwrite");
      const store = tx.objectStore(DB_NAME);
      return store.getAll();
    })
    .then(restaurants => {
      restaurants.forEach(restaurant => {
        if (
          restaurant.is_favorite_pending == "true" ||
          restaurant.is_favorite_pending == true
        ) {
          DBHelper.submitRestaurantPendingFavorites(restaurant);
        }
      });
    });
};

window.addEventListener("offline", e => {
  console.log("offline");
});

window.addEventListener("online", e => {
  console.log("online");
  checkPendingReviews();
  checkPendingFavorites();
});
