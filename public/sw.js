'use strict';
const CACHE='81il-shell-v6:'+self.registration.scope;
const FILES=['./','index.html','style.css','game.js','install.js','app.js','map.svg','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/icon-maskable.png','icons/apple-touch-icon.png'];
const ASSETS=new Set(FILES.map(file=>new URL(file,self.registration.scope).href));
self.addEventListener('install',event=>{
 // Do not replace the worker while a game is open. New versions activate after closing it.
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll([...ASSETS].map(url=>new Request(url,{cache:'reload'})))));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('81il-shell-')&&key.endsWith(':'+self.registration.scope)&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);url.search='';url.hash='';
 if(!ASSETS.has(url.href))return;
 event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(url.href))||fetch(event.request)));
});
