// EasyCal Service Worker v2.0
const CACHE_VERSION = 'easycal-v2.0';
const OFFLINE_PAGE = './offline.html';
const ERROR_PAGE = './tools/error.html';

// Core assets to cache on install
const CORE_ASSETS = [
  // Main Pages
  './',
  './index.html',
  './dashboard.html',
  './admin.html',
  './payment.html',
  './welcome.html',
  
  // CSS Files
  './css/style.css',
  './css/login.css',
  './css/dashboard.css',
  './css/admin.css',
  './css/payment.css',
  
  // JavaScript Files
  './js/auth.js',
  './js/dashboard.js',
  './js/admin.js',
  './js/payment.js',
  
  // Assets
  './assets/images/logo.png',
  './assets/images/qr-code.png',
  
  // Essential tool pages
  './tools/construction/concrete-bricks.html',
  './tools/construction/flooring.html',
  './tools/construction/paint-estimate.html',
  
  './tools/timber/sawn-timber.html',
  './tools/timber/non-sawn.html',
  
  './tools/engineering/blank-tools.html',
  './tools/engineering/soot-mm-inches-converter.html',


  './tools/sawmills/blank-tools.html',

  './tools/thai-glass/blank-tools.html',


  
  // Fallback pages
  OFFLINE_PAGE,
  ERROR_PAGE
];

// Install event - cache core assets
self.addEventListener('install', event => {
  console.log('[EasyCal SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => {
        console.log('[EasyCal SW] Caching core assets');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => {
        console.log('[EasyCal SW] Installation complete');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[EasyCal SW] Installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[EasyCal SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_VERSION) {
            console.log('[EasyCal SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[EasyCal SW] Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch event - smart caching strategy
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET requests and cross-origin requests
  if (request.method !== 'GET' || !url.origin.startsWith(self.location.origin)) {
    return;
  }
  
  // Handle different types of requests
  if (request.mode === 'navigate') {
    // Handle page navigations
    event.respondWith(handlePageRequest(request));
  } else if (request.url.includes('/tools/')) {
    // Handle tool requests
    event.respondWith(handleToolRequest(request));
  } else if (request.destination === 'image') {
    // Handle images
    event.respondWith(handleImageRequest(request));
  } else if (request.url.includes('.css') || request.url.includes('.js')) {
    // Handle CSS/JS files
    event.respondWith(handleAssetRequest(request));
  } else {
    // Handle everything else
    event.respondWith(handleDefaultRequest(request));
  }
});

// Handle page navigation requests
async function handlePageRequest(request) {
  try {
    // Try network first for pages
    const networkResponse = await fetch(request);
    
    // Cache the response for future use
    const cache = await caches.open(CACHE_VERSION);
    await cache.put(request, networkResponse.clone());
    
    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('[EasyCal SW] Serving page from cache:', request.url);
      return cachedResponse;
    }
    
    // No cache, show offline page
    console.log('[EasyCal SW] Showing offline page for:', request.url);
    return caches.match(OFFLINE_PAGE);
  }
}

// Handle tool requests
async function handleToolRequest(request) {
  // Try cache first for tools (fastest)
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    console.log('[EasyCal SW] Serving tool from cache:', request.url);
    return cachedResponse;
  }
  
  try {
    // Not in cache, try network
    const networkResponse = await fetch(request);
    
    // Cache for next time
    const cache = await caches.open(CACHE_VERSION);
    await cache.put(request, networkResponse.clone());
    
    console.log('[EasyCal SW] Cached new tool:', request.url);
    return networkResponse;
  } catch (error) {
    // Network failed, show tool error page
    console.error('[EasyCal SW] Tool fetch failed:', request.url, error);
    return caches.match(ERROR_PAGE);
  }
}

// Handle image requests
async function handleImageRequest(request) {
  // Cache first, then network for images
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(CACHE_VERSION);
    await cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    // Return placeholder if image fails
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">' +
      '<rect width="100" height="100" fill="#f0f0f0"/>' +
      '<text x="50" y="50" text-anchor="middle" dy=".3em" fill="#999" font-family="sans-serif">EasyCal</text>' +
      '</svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
}

// Handle asset requests (CSS, JS)
async function handleAssetRequest(request) {
  // Cache first for assets
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Update in background
    updateCacheInBackground(request);
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(CACHE_VERSION);
    await cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    // Return empty response for failed assets
    return new Response('', { status: 404 });
  }
}

// Handle default requests
async function handleDefaultRequest(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Network error', { status: 408 });
  }
}

// Update cache in background
async function updateCacheInBackground(request) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(CACHE_VERSION);
    await cache.put(request, networkResponse.clone());
  } catch (error) {
    // Silently fail - we have cached version
  }
}

// Background sync for user data
self.addEventListener('sync', event => {
  if (event.tag === 'sync-user-data') {
    event.waitUntil(syncUserData());
  }
});

// Periodic background expiry checking
self.addEventListener('periodicsync', event => {
  if (event.tag === 'check-expiry-daily') {
    event.waitUntil(checkUserExpiryBackground());
  }
});

// Background functions
async function syncUserData() {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'SYNC_USER_DATA',
      timestamp: new Date().toISOString()
    });
  });
}

async function checkUserExpiryBackground() {
  console.log('[EasyCal SW] Background expiry check');
  
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'CHECK_EXPIRY_BACKGROUND',
      timestamp: new Date().toISOString()
    });
  });
}

// Handle messages from the app
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_TOOLS') {
    cacheTools(event.data.tools);
  }
});

// Cache specific tools on demand
async function cacheTools(toolUrls) {
  const cache = await caches.open(CACHE_VERSION);
  
  for (const url of toolUrls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
        console.log('[EasyCal SW] Cached tool on demand:', url);
      }
    } catch (error) {
      console.error('[EasyCal SW] Failed to cache tool:', url, error);
    }
  }
}