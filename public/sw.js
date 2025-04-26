if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("sw.js")
      .then((registration) => {
        console.log("Service Worker registered with scope:", registration.scope);
      })
      .catch((error) => {
        console.error("Service Worker registration failed:", error);
      });
  }

  // กำหนดชื่อ Cache
const CACHE_NAME = "tissuebox-cache-v1";

// ไฟล์ที่ต้องการแคช
const urlsToCache = [
  "/",
  "/index.html",
  "/organization.html",
  "/delivery.html",
  "/update-status.html",
  "/css/style.css",
  "/css/navbar.css",
  "/css/index.css",
  "/js/index/firebase-init.js",
  "/js/index/utils.js",
  "/js/index/marker-utils.js",
  "/js/index/add-position.js",
  "/js/index/box-handler.js",
  "/js/utils/loading.js",
  "/js/utils/navbar.js",
  "/js/utils/toasts.js",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta2/dist/css/bootstrap.min.css",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta2/dist/js/bootstrap.bundle.min.js",
  "https://code.jquery.com/jquery-3.6.0.min.js"
];

// ติดตั้ง Service Worker และแคชไฟล์
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    })
  );
});

// ดักจับการร้องขอและตอบกลับด้วยไฟล์ใน Cache
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // ถ้ามีไฟล์ใน Cache ให้ใช้ไฟล์นั้น
      if (response) {
        return response;
      }
      // ถ้าไม่มีใน Cache ให้ดึงจากเครือข่าย
      return fetch(event.request).then((response) => {
        // ตรวจสอบว่า Response ใช้งานได้หรือไม่
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        // แคชไฟล์ใหม่
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});

// ลบ Cache เก่าที่ไม่ได้ใช้งาน
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