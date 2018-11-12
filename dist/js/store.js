// example from https://github.com/jakearchibald/idb
// November 09th, 2018

const dbPromise = idb.open("mws-s2", 2, upgradeDB => {
  upgradeDB.createObjectStore("restaurants", { keyPath: "id" });
  upgradeDB
    .createObjectStore("reviews", { keyPath: "id" })
    .createIndex("restaurant_id", "restaurant_id");
  upgradeDB.createObjectStore("pending");
});
