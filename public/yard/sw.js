// Cache only the offline fallback.
// Do not cache authenticated pages or API responses.
const CACHE = "cedar-yard-fallback-v1";
const FALLBACK = "/yard/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add(FALLBACK)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith("cedar-yard-fallback-") &&
                key !== CACHE,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (
    event.request.mode === "navigate" &&
    url.origin === self.location.origin &&
    url.pathname.startsWith("/yard/")
  ) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(FALLBACK)),
    );
  }
});