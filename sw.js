// Service worker : l'app s'ouvre même hors connexion une fois installée sur l'écran d'accueil.
// Stratégie « réseau d'abord » pour nos fichiers (les mises à jour arrivent au lancement suivant),
// « cache d'abord » pour les polices. Pensez à incrémenter VERSION à chaque déploiement.
const VERSION = 'pg-v2';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './styles/tokens.css',
  './styles/base.css',
  './styles/components.css',
  './styles/screens.css',
  './styles/motion.css',
  './src/main.js',
  './src/core/dom.js',
  './src/core/icons.js',
  './src/core/motion.js',
  './src/core/router.js',
  './src/core/store.js',
  './src/data/catalog.demo.js',
  './src/data/merchants.js',
  './src/domain/engine.js',
  './src/domain/explain.js',
  './src/domain/interests.js',
  './src/domain/lexicon.js',
  './src/domain/options.js',
  './src/domain/profile.js',
  './src/domain/questionnaire.js',
  './src/services/config.js',
  './src/services/recommendations.js',
  './src/ui/components/art.js',
  './src/ui/components/brand.js',
  './src/ui/components/fields.js',
  './src/ui/components/giftCard.js',
  './src/ui/components/overlay.js',
  './src/ui/components/tabbar.js',
  './src/ui/screens/favorites.js',
  './src/ui/screens/historyScreen.js',
  './src/ui/screens/home.js',
  './src/ui/screens/quiz.js',
  './src/ui/screens/results.js',
  './src/ui/screens/searching.js',
  './assets/icons/favicon.svg',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(`${VERSION}-fonts`).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const res = await fetch(request);
        if (res.ok || res.type === 'opaque') cache.put(request, res.clone());
        return res;
      }),
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  // « no-cache » : on revalide auprès du serveur (304 si inchangé) pour ne jamais servir une version périmée.
  event.respondWith(
    fetch(request, { cache: 'no-cache' })
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(request, copy));
        }
        return res;
      })
      .catch(async () => (await caches.match(request)) || (request.mode === 'navigate' ? caches.match('./index.html') : Response.error())),
  );
});
