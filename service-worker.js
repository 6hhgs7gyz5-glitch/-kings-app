const CACHE_NAME = "kings-v9.2.1-20260814";
const CORE = [
  "./", "./index.html", "./estilo.css?v=kings9v9.2.1", "./app.js?v=kings9v9.2.1",
  "./manifest.json", "./manifest.webmanifest", "./logo.png", "./icon-192.png",
  "./icon-512.png", "./apple-touch-icon.png", "./favicon.png"
];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE).catch(()=>{})).then(()=>self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith("kings-") && k!==CACHE_NAME).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", event => {
  const req=event.request; if(req.method!=="GET") return;
  const url=new URL(req.url); if(url.origin!==location.origin) return;
  if(req.mode==='navigate' || req.destination==='document'){
    event.respondWith(fetch(req,{cache:'no-store'}).then(res=>{
      const copy=res.clone(); caches.open(CACHE_NAME).then(c=>c.put("./index.html",copy)); return res;
    }).catch(()=>caches.match("./index.html"))); return;
  }
  event.respondWith(fetch(req,{cache:'no-store'}).then(res=>{
    const copy=res.clone(); caches.open(CACHE_NAME).then(c=>c.put(req,copy)); return res;
  }).catch(()=>caches.match(req)));
});
self.addEventListener('message', e=>{ if(e.data==='SKIP_WAITING') self.skipWaiting(); });
