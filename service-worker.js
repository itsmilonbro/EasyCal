// EasyCal Service Worker with Tool Caching
const CACHE_NAME = 'easycal-v2.0';
const OFFLINE_URL = 'offline.html';

// Cache ALL essential files including tools
const urlsToCache = [
  // Main Pages
  '/EasyCal/',
  '/EasyCal/index.html',
  '/EasyCal/dashboard.html',
  '/EasyCal/admin.html',
  '/EasyCal/payment.html',
  '/EasyCal/welcome.html',
  
  // CSS Files
  '/EasyCal/css/style.css',
  '/EasyCal/css/login.css',
  '/EasyCal/css/dashboard.css',
  '/EasyCal/css/admin.css',
  '/EasyCal/css/payment.css',
  
  // JavaScript Files
  '/EasyCal/js/auth.js',
  '/EasyCal/js/dashboard.js',
  '/EasyCal/js/admin.js',
  '/EasyCal/js/payment.js',
  
  // Assets
  '/EasyCal/assets/images/logo.png',
  '/EasyCal/assets/images/qr-code.png',
  
  // Tool Pages - ADDING TOOLS FOLDER FILES
  '/EasyCal/tools/construction/concrete-bricks.html',
  '/EasyCal/tools/construction/flooring.html',
  '/EasyCal/tools/construction/paint-estimate.html',
  '/EasyCal/tools/construction/steel-reinforcement.html',
  
  '/EasyCal/tools/timber/sawn-timber.html',
  '/EasyCal/tools/timber/non-sawn.html',
  '/EasyCal/tools/timber/wood-volume.html',
  
  '/EasyCal/tools/engineering/blank-tools.html',
  
  '/EasyCal/tools/sawmills/blank-tools.html',
  
  '/EasyCal/tools/thai-glass/blank-tools.html'
];

// Dynamic caching for other tool pages as they're accessed
const dynamicCacheName = 'easycal-tools-v1';

// Install event - cache essential files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('EasyCal: Caching essential files and tools');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Fetch event with smart caching strategy
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  
  // Skip non-GET requests and chrome-extension requests
  if (event.request.method !== 'GET' || 
      requestUrl.protocol === 'chrome-extension:') {
    return;
  }
  
  // Special handling for tool pages
  if (requestUrl.pathname.includes('/tools/')) {
    handleToolRequest(event);
    return;
  }
  
  // For other pages, use cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return cached response if available
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Otherwise fetch from network
        return fetch(event.request)
          .then(response => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response for caching
            const responseToCache = response.clone();
            
            // Cache in dynamic cache for tools, regular cache for others
            const cacheToUse = requestUrl.pathname.includes('/tools/') 
              ? dynamicCacheName 
              : CACHE_NAME;
            
            caches.open(cacheToUse)
              .then(cache => {
                cache.put(event.request, responseToCache);
                console.log('EasyCal: Cached new resource:', event.request.url);
              });
            
            return response;
          })
          .catch(() => {
            // If offline and page request, show offline page
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            
            // For other requests, return null
            return null;
          });
      })
  );
});

// Special handler for tool requests
function handleToolRequest(event) {
  const requestUrl = event.request.url;
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // If tool is cached, return it immediately (fastest)
        if (cachedResponse) {
          console.log('EasyCal: Serving cached tool:', requestUrl);
          return cachedResponse;
        }
        
        // If not cached, fetch from network
        return fetch(event.request)
          .then(response => {
            // Don't cache if invalid response
            if (!response || response.status !== 200) {
              return response;
            }
            
            // Clone response for caching
            const responseToCache = response.clone();
            
            // Cache tool for future use
            caches.open(dynamicCacheName)
              .then(cache => {
                cache.put(event.request, responseToCache);
                console.log('EasyCal: Cached new tool:', requestUrl);
              });
            
            return response;
          })
          .catch(error => {
            console.error('EasyCal: Failed to fetch tool:', requestUrl, error);
            
            // If tool fails to load, show a friendly error page
            return caches.match('/EasyCal/tools/error.html')
              .then(errorPage => {
                return errorPage || new Response(
                  `<h1>Tool Offline</h1>
                  <p>This calculation tool is not available offline.</p>
                  <p>Please connect to the internet to access this tool.</p>`,
                  { headers: { 'Content-Type': 'text/html' } }
                );
              });
          });
      })
  );
}

// Background check for user expiry dates
self.addEventListener('periodicsync', event => {
  if (event.tag === 'check-expiry') {
    event.waitUntil(checkExpiryDates());
  }
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME, dynamicCacheName];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('EasyCal: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Claim all clients immediately
      return self.clients.claim();
    })
  );
});

// Function to check expiry dates in background
async function checkExpiryDates() {
  const clients = await self.clients.matchAll();
  
  clients.forEach(client => {
    // Send message to client to check expiry
    client.postMessage({
      type: 'CHECK_EXPIRY',
      timestamp: new Date().toISOString()
    });
  });
}

// Handle messages from the main app
self.addEventListener('message', event => {
  if (event.data.type === 'CACHE_TOOLS') {
    // Cache specific tools on demand
    cacheToolsOnDemand(event.data.tools);
  }
});

// Cache tools on demand (when user accesses them)
async function cacheToolsOnDemand(toolUrls) {
  const cache = await caches.open(dynamicCacheName);
  
  toolUrls.forEach(async url => {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
        console.log('EasyCal: Cached tool on demand:', url);
      }
    } catch (error) {
      console.error('EasyCal: Failed to cache tool:', url, error);
    }
  });
}

// Pre-cache tools when service worker is idle
self.addEventListener('message', event => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});