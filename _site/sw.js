const version = '20200626151649';
const cacheName = `static::${version}`;

const buildContentBlob = () => {
  return ["/blog/2013/03/01/holding-on/","/blog/2013/02/01/blog-offline/","/blog/index.php/2012/12/21/deploy-or-migrate-a-database-using-scripts-part-1/","/blog/index.php/2011/04/30/documenting-the-owner-of-a-generic-database-user/","/blog/index.php/2011/04/23/compare-the-contents-data-of-two-tables/","/blog/index.php/2011/04/16/use-the-forfiles-utility-to-delete-old-database-backup-files/","/blog/index.php/2011/04/09/using-guids-as-primary-keys-or-not/","/blog/index.php/2011/04/02/sql-server-connection-strings-unique-application-dns-and-listening-ports/","/blog/index.php/2011/03/26/create-a-database-mail-profile-in-4-steps-or-less/","/blog/index.php/2011/03/19/script-logins-from-database-users/","/about/","/feed.xml","/","/assets/css/main.css","/assets/js/staticman.js","/tags/","/page2/","/page3/","/page4/","/page5/","/sitemap.xml","/robots.txt","", "/assets/default-offline-image.png", "/assets/scripts/fetch.js"
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
