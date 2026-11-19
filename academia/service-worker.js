// Projeto Z — service worker (cache-first, só mesma origem)
const CACHE = "projetoz-v6";
const FILES = [
"./",
"./index.html",
"./manifest.webmanifest",
"./icon-192.png",
"./icon-512.png",
"./icon-512-maskable.png",
"./logo.jpg",
"./videos/Ab_Roller.mp4",
"./videos/Air_Bike.mp4",
"./videos/Alternate_Incline_Dumbbell_Curl.mp4",
"./videos/Barbell_Bench_Press_-_Medium_Grip.mp4",
"./videos/Barbell_Curl.mp4",
"./videos/Barbell_Deadlift.mp4",
"./videos/Barbell_Glute_Bridge.mp4",
"./videos/Barbell_Hip_Thrust.mp4",
"./videos/Barbell_Incline_Bench_Press_-_Medium_Grip.mp4",
"./videos/Barbell_Squat.mp4",
"./videos/Barbell_Walking_Lunge.mp4",
"./videos/Bench_Dips.mp4",
"./videos/Bent_Over_Barbell_Row.mp4",
"./videos/Bicycling_Stationary.mp4",
"./videos/Butt_Lift_Bridge.mp4",
"./videos/Butterfly.mp4",
"./videos/Cable_Crossover.mp4",
"./videos/Cable_Crunch.mp4",
"./videos/Cable_Hammer_Curls_-_Rope_Attachment.mp4",
"./videos/Cable_One_Arm_Tricep_Extension.mp4",
"./videos/Cable_Rear_Delt_Fly.mp4",
"./videos/Close-Grip_Barbell_Bench_Press.mp4",
"./videos/Close-Grip_Front_Lat_Pulldown.mp4",
"./videos/Concentration_Curls.mp4",
"./videos/Crunches.mp4",
"./videos/Dips_-_Chest_Version.mp4",
"./videos/Dumbbell_Bench_Press.mp4",
"./videos/Dumbbell_Bicep_Curl.mp4",
"./videos/Dumbbell_Flyes.mp4",
"./videos/Dumbbell_Lunges.mp4",
"./videos/Dumbbell_Rear_Lunge.mp4",
"./videos/Dumbbell_Shoulder_Press.mp4",
"./videos/Dumbbell_Step_Ups.mp4",
"./videos/EZ-Bar_Curl.mp4",
"./videos/EZ-Bar_Skullcrusher.mp4",
"./videos/Elliptical_Trainer.mp4",
"./videos/Face_Pull.mp4",
"./videos/Flat_Bench_Lying_Leg_Raise.mp4",
"./videos/Front_Dumbbell_Raise.mp4",
"./videos/Glute_Kickback.mp4",
"./videos/Goblet_Squat.mp4",
"./videos/Hack_Squat.mp4",
"./videos/Hammer_Curls.mp4",
"./videos/Hanging_Leg_Raise.mp4",
"./videos/Hyperextensions_Back_Extensions.mp4",
"./videos/Incline_Dumbbell_Press.mp4",
"./videos/Jogging_Treadmill.mp4",
"./videos/Leg_Extensions.mp4",
"./videos/Leg_Press.mp4",
"./videos/Lying_Leg_Curls.mp4",
"./videos/Machine_Bench_Press.mp4",
"./videos/Machine_Shoulder_Military_Press.mp4",
"./videos/Mountain_Climbers.mp4",
"./videos/One-Arm_Dumbbell_Row.mp4",
"./videos/One-Legged_Cable_Kickback.mp4",
"./videos/Plank.mp4",
"./videos/Plie_Dumbbell_Squat.mp4",
"./videos/Preacher_Curl.mp4",
"./videos/Pull_Through.mp4",
"./videos/Pullups.mp4",
"./videos/Pushups.mp4",
"./videos/Reverse_Flyes.mp4",
"./videos/Reverse_Grip_Bent-Over_Rows.mp4",
"./videos/Romanian_Deadlift.mp4",
"./videos/Rope_Jumping.mp4",
"./videos/Rowing_Stationary.mp4",
"./videos/Russian_Twist.mp4",
"./videos/Seated_Cable_Rows.mp4",
"./videos/Seated_Calf_Raise.mp4",
"./videos/Seated_Dumbbell_Press.mp4",
"./videos/Seated_Leg_Curl.mp4",
"./videos/Side_Lateral_Raise.mp4",
"./videos/Smith_Machine_Squat.mp4",
"./videos/Split_Squat_with_Dumbbells.mp4",
"./videos/Standing_Calf_Raises.mp4",
"./videos/Standing_Dumbbell_Triceps_Extension.mp4",
"./videos/Standing_Military_Press.mp4",
"./videos/Stiff-Legged_Dumbbell_Deadlift.mp4",
"./videos/Straight-Arm_Pulldown.mp4",
"./videos/T-Bar_Row_with_Handle.mp4",
"./videos/Thigh_Abductor.mp4",
"./videos/Thigh_Adductor.mp4",
"./videos/Tricep_Dumbbell_Kickback.mp4",
"./videos/Triceps_Pushdown.mp4",
"./videos/Triceps_Pushdown_-_Rope_Attachment.mp4",
"./videos/Upright_Barbell_Row.mp4",
"./videos/Wide-Grip_Lat_Pulldown.mp4"
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
async function rangeResponse(req, res) {
  const range = req.headers.get("range"); if (!range || !res) return res;
  const buf = await res.arrayBuffer(); const size = buf.byteLength;
  const m = /bytes=(\d*)-(\d*)/.exec(range); if (!m) return new Response(buf, {headers: res.headers});
  let start = m[1] === "" ? Math.max(0, size - (+m[2])) : +m[1];
  let end = m[1] !== "" && m[2] !== "" ? +m[2] : size - 1; end = Math.min(end, size - 1);
  if (start >= size) return new Response(null, {status: 416, headers: {"Content-Range": "bytes */" + size}});
  return new Response(buf.slice(start, end + 1), {status: 206, statusText: "Partial Content", headers: {
    "Content-Type": res.headers.get("Content-Type") || "video/mp4", "Content-Range": `bytes ${start}-${end}/${size}`,
    "Content-Length": String(end - start + 1), "Accept-Ranges": "bytes"}});
}
self.addEventListener("fetch", e => {
  const req = e.request; const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const key = req.mode === "navigate" ? "./index.html" : url.pathname + url.search;
    if (req.mode === "navigate") {
      try { const net = await fetch(req); if (net.ok) { cache.put("./index.html", net.clone()); return net; } } catch (err) {}
    }
    let res = await cache.match(key, {ignoreSearch: req.mode === "navigate"});
    if (!res) {
      try {
        const net = await fetch(req.headers.get("range") ? new Request(req.url) : req);
        if (net.ok && net.status === 200) { cache.put(key, net.clone()); }
        res = net;
      } catch (err) {
        res = req.mode === "navigate" ? await cache.match("./index.html") : undefined;
        if (!res) return new Response("Offline", {status: 503});
      }
    }
    return req.headers.get("range") ? rangeResponse(req, res.clone()) : res;
  })());
});
