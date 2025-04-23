const CACHE_NAME = "tissuebox-cache-v1";
const urlsToCache = [
  "/", // หน้าแรก
  "/index.html",
  "/delivery.html",
  "/organization.html",
  "/css/style.css",
  "/css/navbar.css",
  "/js/utils/loading.js",
  "/js/utils/navbar.js",
  "/js/index/map-init.js",
  "/js/index/firebase-init.js",
  "/js/index/utils.js",
  "/js/index/marker-utils.js",
  "/js/index/add-position.js",
  "/js/index/box-handler.js",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta2/dist/css/bootstrap.min.css",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta2/dist/js/bootstrap.bundle.min.js",
  "https://maps.googleapis.com/maps/api/js?key=AIzaSyDsGCBKGEvufoikZgscLJSxi-wQ28_c9GQ&libraries=marker&loading=async",
];

// ติดตั้ง Service Worker และเก็บไฟล์ใน Cache
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    })
  );
});

// ดึงไฟล์จาก Cache เมื่อมีการร้องขอ
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // ถ้ามีไฟล์ใน Cache ให้ใช้ไฟล์นั้น
      if (response) {
        return response;
      }
      // ถ้าไม่มีใน Cache ให้ดึงจากเครือข่าย
      return fetch(event.request);
    })
  );
});

// อัปเดต Cache เมื่อมีการเปลี่ยนแปลง
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});