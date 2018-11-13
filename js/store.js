// example from https://github.com/jakearchibald/idb
// November 09th, 2018

const dbPromise = idb.open("mws-s2", 1, upgradeDB => {
  upgradeDB.createObjectStore("restaurants", { keyPath: "id" });
  upgradeDB
    .createObjectStore("reviews", { keyPath: "id" })
    .createIndex("restaurant_id", "restaurant_id");
  upgradeDB
    .createObjectStore("offline-reviews", {
      keyPath: "id",
      autoIncrement: true
    })
    .createIndex("restaurant_id", "restaurant_id");
  upgradeDB
    .createObjectStore("offline-favorites", {
      keyPath: "id",
      autoIncrement: true
    })
    .createIndex("restaurant_id", "restaurant_id");
});
