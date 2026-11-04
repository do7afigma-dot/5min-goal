const C='fm-v2',F=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)));self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
function idb(){return new Promise((res,rej)=>{const q=indexedDB.open('fm-rem',1);q.onupgradeneeded=()=>q.result.createObjectStore('kv');q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})}
// Atomically decide + mark "sent today" so the app and the worker never both notify.
function claim(){return idb().then(d=>new Promise(res=>{const tx=d.transaction('kv','readwrite'),st=tx.objectStore('kv'),r=st.get('cfg');let c=null,go=false;
 r.onsuccess=()=>{c=r.result;if(!c||!c.enabled||!c.time)return;const n=new Date(),hm=c.time.split(':').map(Number);if(n.getHours()*60+n.getMinutes()<hm[0]*60+hm[1])return;const t=ymd(n);if(c.lastSent===t||c.lastDone===t)return;c.lastSent=t;go=true;st.put(c,'cfg')};
 tx.oncomplete=()=>res(go?c:null);tx.onerror=tx.onabort=()=>res(null)})).catch(()=>null)}
async function check(){const c=await claim();if(!c)return;
 try{await self.registration.showNotification('5 minutes',{body:(c.action||'Your goal').replace(/[.!?\s]+$/,'')+'. Just 5 minutes.',tag:'daily-5min',icon:'icon-192.png'})}catch(e){}}
self.addEventListener('periodicsync',e=>{if(e.tag==='daily-reminder')e.waitUntil(check())});
self.addEventListener('notificationclick',e=>{e.notification.close();
 e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(l=>{for(const c of l){if('focus' in c)return c.focus()}return clients.openWindow('./index.html')}))});
