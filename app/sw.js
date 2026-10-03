/* LessonPrep Stage 7 — offline shell. Cache-first for app files;
   teacher data lives in IndexedDB (never cached, never leaves device). */
var CACHE = "lp-v1";
var SHELL = [
  "index.html", "create.html", "lesson.html", "lessons.html",
  "resources.html", "profile.html", "timetable.html", "prototype.html",
  "styles.css", "app.js", "db.js", "ai.js", "manifest.json", "icon.svg",
  "vendor/dexie.min.js"
];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request).then(function (hit) { return hit || fetch(e.request); }));
});
