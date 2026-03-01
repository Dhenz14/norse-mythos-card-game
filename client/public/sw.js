const CACHE_NAME = 'ragnarok-assets-v1';

const ASSET_DIRS = [
	'/art/', '/models/', '/portraits/', '/textures/', '/sounds/',
	'/icons/', '/heroes/', '/ui/', '/geometries/', '/fonts/',
];

const ASSET_EXTS = [
	'.webp', '.png', '.jpg', '.jpeg', '.gif', '.svg',
	'.glb', '.gltf', '.mp3', '.ogg', '.wav',
];

function getBase() {
	const swUrl = new URL(self.location);
	return swUrl.pathname.replace(/sw\.js$/, '');
}

function isAssetRequest(url) {
	const parsed = new URL(url);
	const base = getBase();
	const normalized = parsed.pathname.startsWith(base)
		? '/' + parsed.pathname.slice(base.length)
		: parsed.pathname;

	if (ASSET_DIRS.some(function(dir) { return normalized.includes(dir); })) return true;
	if (ASSET_EXTS.some(function(ext) { return normalized.endsWith(ext); })) return true;
	return false;
}

self.addEventListener('install', function() {
	self.skipWaiting();
});

self.addEventListener('activate', function(event) {
	event.waitUntil(
		caches.keys().then(function(names) {
			return Promise.all(
				names
					.filter(function(name) { return name !== CACHE_NAME; })
					.map(function(name) { return caches.delete(name); })
			);
		}).then(function() {
			return self.clients.claim();
		})
	);
});

self.addEventListener('fetch', function(event) {
	var request = event.request;

	if (request.method !== 'GET') return;

	if (request.mode === 'navigate') {
		event.respondWith(
			fetch(request).catch(function() {
				return caches.match(request).then(function(cached) {
					return cached || caches.match(getBase() + 'index.html');
				});
			})
		);
		return;
	}

	if (isAssetRequest(request.url)) {
		event.respondWith(
			caches.match(request).then(function(cached) {
				if (cached) return cached;
				return fetch(request).then(function(response) {
					if (response.ok) {
						var clone = response.clone();
						caches.open(CACHE_NAME).then(function(cache) {
							cache.put(request, clone);
						});
					}
					return response;
				});
			})
		);
		return;
	}

	event.respondWith(
		fetch(request).catch(function() {
			return caches.match(request);
		})
	);
});
