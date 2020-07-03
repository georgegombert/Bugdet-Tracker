// const { response } = require("express");

// const { response } = require("express");

const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "index.js",
  "icons/icon-192x192.png",
  "icons/icon-512x512.png"
];

const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";
const PENDING_CACHE = "pending-cache-v1";

// install
self.addEventListener("install", function (evt) {
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Your files were pre-cached successfully!");
      return cache.addAll(FILES_TO_CACHE);
    })
  );

  self.skipWaiting();
});

// activate
self.addEventListener("activate", function (evt) {
  console.log("hit activate");
  evt.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
            console.log("Removing old cache data", key);
            return caches.delete(key);
          }
        })
      );
    })
  );

  self.clients.claim();
});


// fetch
self.addEventListener("fetch", function (evt) {
  if (evt.request.url.match("/api/transaction")) {
    evt.respondWith(
      caches
        .open(DATA_CACHE_NAME)
        .then((cache) => {
          return fetch(evt.request)
            .then((response) => {
              // If the response was good, clone it and store it in the cache.
              if (response.status === 200) {
                console.log(response);
                cache.put(evt.request.url, response.clone());
              }

              return response;
            })
            .catch((err) => {
              // Network request failed, try to get it from the cache.
              return cache.match(evt.request);
            });
        })
        .catch((err) => console.log(err))
    );

    return;
  }

  if (evt.request.url.match("/api/post/transaction")) {
    evt.respondWith(
      caches
        .open(PENDING_CACHE)
        .then((cache) => {
          return fetch(evt.request)
            .then((response) => {
              // If the response was good, clone it and store it in the cache.
              if (response.status === 200) {
                console.log(response);
                cache.put(evt.request.url, response.clone());
              }

              return response;
            })
            .catch((err) => {
              // Network request failed, try to get it from the cache.
              return cache.match(evt.request);
            });
        })
        .catch((err) => console.log(err))
    );

    return;
  }

  evt.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(evt.request).then((response) => {
        return response || fetch(evt.request);
      });
    })
  );
});

// Sync

self.addEventListener('sync', function (event) {
  if (event.tag == 'syncTransactions') {
    console.log("hit sync");
    //event.waitUntil(doSomeStuff());
    caches.open(PENDING_CACHE).then(async function(cache) {
      const response = await cache.match('/api/post/transaction');
      console.log(response);
    })
    // caches
    //   .open(PENDING_CACHE).then((cache) => {
    //     console.log(cache);
    //     cache.keys().then(res => {
    //       console.log(res);
    //       res.map(name =>{
    //         console.log(name);
    //       })
    //     })
    //   })
  }
});