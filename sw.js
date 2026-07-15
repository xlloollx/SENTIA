/* Sentia — Service Worker
   Précache l'application complète (HTML + toutes les photos) pour un
   fonctionnement 100% hors connexion sur la rivière.
   Stratégie : network-first pour Sentia.html (mises à jour), cache-first
   pour tout le reste (photos, icônes). Incrémenter VERSION à chaque publication. */
const VERSION = 'sentia-v12';

const ASSETS = [
  './Sentia.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
  './fondo_web.jpg',
  './Vierge_gabariers_web.jpg',
  './Belvedere_Marqueyssac_web.jpg',
  './Pont_de_Vezac_web.jpg',
  './Rocher_de_Caudon_web.jpg',
  './Vitrac%20port.JPG',
  './Pont%20de%20vitrac.JPG',
  './La%20Roque-Gageac.JPG',
  './La%20plage%20de%20la%20malartrie.JPG',
  './La%20bulide.jpg',
  './Ceou.jpg',
  './Pont%20de%20castelnaud.jpg',
  './Castelnaud.JPG',
  './Fayrac.jpg',
  './Chateau%20de%20Beynac.jpg',
  './chateau%20des%20Milandes.jpg',
  './Depart%20de%20Carsac.jpg',
  './Monfort.jpg',
  './Chateau%20de%20Fenelon.jpg',
  './Embarcadere%20Grolegeac.jpg',
  "./La%20cavit%C3%A9%20d'Ali%C3%A9nor.jpg",
  './bastide%20domme.jpg',
  './Pont%20de%20Cenac.jpg'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const isAppShell = e.request.mode === 'navigate' || url.pathname.endsWith('/Sentia.html');

  if (isAppShell) {
    // network-first : les mises à jour arrivent dès qu'il y a du réseau
    e.respondWith(
      fetch(e.request)
        .then(resp => {
          const copy = resp.clone();
          caches.open(VERSION).then(c => c.put('./Sentia.html', copy));
          return resp;
        })
        .catch(() => caches.match('./Sentia.html'))
    );
    return;
  }

  // cache-first pour photos & assets
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => {
      if (hit) return hit;
      return fetch(e.request).then(resp => {
        if (resp.ok && url.origin === self.location.origin) {
          const copy = resp.clone();
          caches.open(VERSION).then(c => c.put(e.request, copy));
        }
        return resp;
      });
    })
  );
});
