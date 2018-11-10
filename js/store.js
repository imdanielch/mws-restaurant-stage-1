// example from https://github.com/jakearchibald/idb
// November 09th, 2018

const dbPromise = idb.open("mws-s2", 1, upgradeDB => {
  upgradeDB.createObjectStore("restaurants", { keyPath: "id" });
});
