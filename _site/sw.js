const version = '20200907125227';
const cacheName = `static::${version}`;

const buildContentBlob = () => {
  return ["/blog/2013/03/holding-on/","/blog/2013/02/blog-offline/","/blog/index.php/2012/12/deploy-or-migrate-a-database-using-scripts-part-2/","/blog/index.php/2012/12/deploy-or-migrate-a-database-using-scripts-part-1/","/blog/index.php/2012/12/t-sql-to-transfer-data-based-on-periodic-date-ranges/","/blog/index.php/2012/12/instance-pre-installation-checklist/","/blog/index.php/2012/12/configuring-the-scom-2012-sql-server-management-pack-for-low-privilege-access/","/blog/index.php/2012/12/remote-statistics-not-available-errors/","/blog/index.php/2012/11/percent-complete-and-estimated-completion-time-for-backup-processes/","/blog/index.php/2012/11/table-counts-plus-space-used-by-data-and-indexes/","/about/","/assets/css/beautifuljekyll.css","/feed.xml","/","/assets/js/staticman.js","/tags/","/page2/","/page3/","/page4/","/page5/","/page6/","/page7/","/page8/","/page9/","/page10/","/page11/","/page12/","/page13/","/page14/","/page15/","/page16/","/page17/","/page18/","/page19/","/page20/","/page21/","/page22/","/sitemap.xml","/robots.txt","", "/assets/default-offline-image.png", "/assets/scripts/fetch.js"
  ]
}

const updateStaticCache = () => {
  return caches.open(cacheName).then(cache => {
    return cache.addAll(buildContentBlob());
  });
};

const clearOldCache = () => {
  return caches.keys().then(keys => {
    // Remove caches whose name is no longer valid.
    return Promise.all(
      keys
        .filter(key => {
          return key !== cacheName;
        })
        .map(key => {
          console.log(`Service Worker: removing cache ${key}`);
          return caches.delete(key);
        })
    );
  });
};

self.addEventListener("install", event => {
  event.waitUntil(
    updateStaticCache().then(() => {
      console.log(`Service Worker: cache updated to version: ${cacheName}`);
    })
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(clearOldCache());
});

self.addEventListener("fetch", event => {
  let request = event.request;
  let url = new URL(request.url);

  // Only deal with requests from the same domain.
  if (url.origin !== location.origin) {
    return;
  }

  // Always fetch non-GET requests from the network.
  if (request.method !== "GET") {
    event.respondWith(fetch(request));
    return;
  }

  // Default url returned if page isn't cached
  let offlineAsset = "/offline/";

  if (request.url.match(/\.(jpe?g|png|gif|svg)$/)) {
    // If url requested is an image and isn't cached, return default offline image
    offlineAsset = "/assets/default-offline-image.png";
  }

  // For all urls request image from network, then fallback to cache, then fallback to offline page
  event.respondWith(
    fetch(request).catch(async () => {
      return (await caches.match(request)) || caches.match(offlineAsset);
    })
  );
  return;
});
