/**
 * Drive every street in Mahalakshmi Layout, including the small lanes,
 * then save that path as the auto's route.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const geometry = JSON.parse(readFileSync('src/data/ward57ClientGeometry.json', 'utf8'));
const ring = geometry.outline;

function inside(lat, lng) {
  let hit = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [latI, lngI] = ring[i];
    const [latJ, lngJ] = ring[j];
    const cross = ((lngI > lng) !== (lngJ > lng))
      && (lat < ((latJ - latI) * (lng - lngI)) / (lngJ - lngI) + latI);
    if (cross) hit = !hit;
  }
  return hit;
}

function meters(a, b) {
  const earth = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * earth * Math.asin(Math.sqrt(h));
}

let south = 90;
let north = -90;
let west = 180;
let east = -180;
ring.forEach(([lat, lng]) => {
  south = Math.min(south, lat);
  north = Math.max(north, lat);
  west = Math.min(west, lng);
  east = Math.max(east, lng);
});

const query = `
[out:json][timeout:90];
way["highway"~"^(primary|secondary|tertiary|unclassified|residential|living_street|service)$"](${south},${west},${north},${east});
out geom;
`;
const cachePath = 'scripts/ward39-streets-cache.json';
let payload;
if (existsSync(cachePath)) {
  payload = JSON.parse(readFileSync(cachePath, 'utf8'));
  console.log('source cache');
} else {
  let lastError = 'no endpoint';
  for (const endpoint of ['https://overpass.kumi.systems/api/interpreter', 'https://overpass-api.de/api/interpreter']) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'bswml-ward-demo/1.0 (local prototype)',
        Accept: 'application/json',
      },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!response.ok) {
      lastError = `${endpoint} ${response.status}`;
      console.log(lastError);
      continue;
    }
    payload = await response.json();
    writeFileSync(cachePath, JSON.stringify(payload));
    console.log('source', endpoint);
    break;
  }
  if (!payload) {
    const mapUrl = `https://api.openstreetmap.org/api/0.6/map?bbox=${west},${south},${east},${north}`;
    const response = await fetch(mapUrl, {
      headers: { 'User-Agent': 'bswml-ward-demo/1.0 (local prototype)' },
    });
    if (!response.ok) throw new Error(`${lastError}; OSM ${response.status}`);
    const xml = await response.text();
    const osmNodes = new Map();
    for (const match of xml.matchAll(/<node id="(-?\d+)"[^>]*?lat="([^"]+)" lon="([^"]+)"/g)) {
      osmNodes.set(match[1], { lat: Number(match[2]), lon: Number(match[3]) });
    }
    const elements = [];
    const keep = /^(primary|secondary|tertiary|unclassified|residential|living_street|service)$/;
    for (const way of xml.matchAll(/<way [\s\S]*?<\/way>/g)) {
      const body = way[0];
      const highway = body.match(/<tag k="highway" v="([^"]+)"/);
      if (!highway || !keep.test(highway[1])) continue;
      const geometry = [];
      for (const nd of body.matchAll(/<nd ref="(-?\d+)"/g)) {
        const node = osmNodes.get(nd[1]);
        if (node) geometry.push(node);
      }
      if (geometry.length >= 2) elements.push({ geometry });
    }
    payload = { elements };
    writeFileSync(cachePath, JSON.stringify(payload));
    console.log('source osm api', elements.length);
  }
}

const keyOf = (lat, lng) => `${lat.toFixed(5)},${lng.toFixed(5)}`;
const lines = [];
for (const way of payload.elements || []) {
  let current = [];
  const flush = () => {
    const line = current.filter((point, index, list) => (
      index === 0 || keyOf(point.lat, point.lng) !== keyOf(list[index - 1].lat, list[index - 1].lng)
    ));
    current = [];
    if (line.length >= 2) lines.push(line);
  };
  for (const point of way.geometry || []) {
    if (!inside(point.lat, point.lon)) {
      flush();
      continue;
    }
    current.push({ lat: point.lat, lng: point.lon });
  }
  flush();
}

const verts = lines.flat();
const parent = verts.map((_, index) => index);
const find = (index) => {
  let cursor = index;
  while (parent[cursor] !== cursor) {
    parent[cursor] = parent[parent[cursor]];
    cursor = parent[cursor];
  }
  return cursor;
};
const unite = (a, b) => {
  const ra = find(a);
  const rb = find(b);
  if (ra !== rb) parent[rb] = ra;
};
const snapCell = 0.00012;
const buckets = new Map();
verts.forEach((point, index) => {
  const key = `${Math.round(point.lat / snapCell)}:${Math.round(point.lng / snapCell)}`;
  if (!buckets.has(key)) buckets.set(key, []);
  buckets.get(key).push(index);
});
verts.forEach((point, index) => {
  const cx = Math.round(point.lat / snapCell);
  const cy = Math.round(point.lng / snapCell);
  for (let dx = -1; dx <= 1; dx += 1) {
    for (let dy = -1; dy <= 1; dy += 1) {
      for (const other of buckets.get(`${cx + dx}:${cy + dy}`) || []) {
        if (other > index && meters(point, verts[other]) <= 8) unite(index, other);
      }
    }
  }
});
const canon = new Map();
verts.forEach((point, index) => {
  const root = find(index);
  if (!canon.has(root)) canon.set(root, { lat: 0, lng: 0, n: 0 });
  const item = canon.get(root);
  item.lat += point.lat;
  item.lng += point.lng;
  item.n += 1;
});
verts.forEach((point, index) => {
  const item = canon.get(find(index));
  point.lat = item.lat / item.n;
  point.lng = item.lng / item.n;
});
for (let i = 0; i < lines.length; i += 1) {
  lines[i] = lines[i].filter((point, index, list) => (
    index === 0 || keyOf(point.lat, point.lng) !== keyOf(list[index - 1].lat, list[index - 1].lng)
  ));
}
function smallLanes(roads) {
  const places = JSON.parse(readFileSync('src/data/ward39Places.json', 'utf8')).places;
  const lat0 = 13.0075;
  const lng0 = 77.543;
  const cos = Math.cos((lat0 * Math.PI) / 180);
  const toX = (lng) => (lng - lng0) * cos * 111320;
  const toY = (lat) => (lat - lat0) * 110540;
  const toLat = (y) => lat0 + y / 110540;
  const toLng = (x) => lng0 + x / (cos * 111320);
  const roadPts = [];
  for (const line of roads) {
    for (const point of line) {
      roadPts.push({ x: toX(point.lng), y: toY(point.lat), lat: point.lat, lng: point.lng });
    }
  }
  const rcell = 25;
  const rgrid = new Map();
  roadPts.forEach((point, index) => {
    const key = `${Math.round(point.x / rcell)}:${Math.round(point.y / rcell)}`;
    if (!rgrid.has(key)) rgrid.set(key, []);
    rgrid.get(key).push(index);
  });
  const nearestRoad = (x, y, max) => {
    const cx = Math.round(x / rcell);
    const cy = Math.round(y / rcell);
    let best = null;
    let bestD = max;
    for (let dx = -2; dx <= 2; dx += 1) {
      for (let dy = -2; dy <= 2; dy += 1) {
        for (const index of rgrid.get(`${cx + dx}:${cy + dy}`) || []) {
          const point = roadPts[index];
          const distance = Math.hypot(point.x - x, point.y - y);
          if (distance < bestD) {
            bestD = distance;
            best = point;
          }
        }
      }
    }
    return best;
  };
  const houses = places.map((place) => ({ x: toX(place.lng), y: toY(place.lat) }));
  const hcell = 18;
  const hgrid = new Map();
  houses.forEach((point, index) => {
    const key = `${Math.round(point.x / hcell)}:${Math.round(point.y / hcell)}`;
    if (!hgrid.has(key)) hgrid.set(key, []);
    hgrid.get(key).push(index);
  });
  const nearby = (index, minD, maxD) => {
    const point = houses[index];
    const cx = Math.round(point.x / hcell);
    const cy = Math.round(point.y / hcell);
    const span = Math.ceil(maxD / hcell);
    const found = [];
    for (let dx = -span; dx <= span; dx += 1) {
      for (let dy = -span; dy <= span; dy += 1) {
        for (const other of hgrid.get(`${cx + dx}:${cy + dy}`) || []) {
          if (other === index) continue;
          const next = houses[other];
          const ddx = next.x - point.x;
          const ddy = next.y - point.y;
          const distance = Math.hypot(ddx, ddy);
          if (distance >= minD && distance <= maxD) found.push({ j: other, d: distance, dx: ddx, dy: ddy });
        }
      }
    }
    return found;
  };
  const nearestHouseDist = (x, y) => {
    const cx = Math.round(x / hcell);
    const cy = Math.round(y / hcell);
    let best = Infinity;
    for (let dx = -1; dx <= 1; dx += 1) {
      for (let dy = -1; dy <= 1; dy += 1) {
        for (const index of hgrid.get(`${cx + dx}:${cy + dy}`) || []) {
          best = Math.min(best, Math.hypot(houses[index].x - x, houses[index].y - y));
        }
      }
    }
    return best;
  };
  const rowDir = (index) => {
    const found = nearby(index, 5, 14).sort((a, b) => a.d - b.d).slice(0, 3);
    if (!found.length) return null;
    let sx = 0;
    let sy = 0;
    for (const item of found) {
      const angle = Math.atan2(item.dy, item.dx);
      sx += Math.cos(angle * 2);
      sy += Math.sin(angle * 2);
    }
    const angle = Math.atan2(sy, sx) / 2;
    return { x: Math.cos(angle), y: Math.sin(angle) };
  };
  const raw = [];
  const seenPair = new Set();
  for (let index = 0; index < houses.length; index += 1) {
    const dir = rowDir(index);
    if (!dir) continue;
    for (const item of nearby(index, 12, 26)) {
      const pair = `${Math.min(index, item.j)}:${Math.max(index, item.j)}`;
      if (seenPair.has(pair)) continue;
      const along = Math.abs(item.dx * dir.x + item.dy * dir.y);
      const across = Math.abs(-item.dx * dir.y + item.dy * dir.x);
      if (across < 11 || along > 8) continue;
      const x = houses[index].x + item.dx / 2;
      const y = houses[index].y + item.dy / 2;
      const road = nearestRoad(x, y, 8);
      if (road && Math.hypot(road.x - x, road.y - y) < 7) continue;
      if (nearestHouseDist(x, y) < 4.2) continue;
      seenPair.add(pair);
      raw.push({ x, y });
    }
  }
  const mids = [];
  const taken = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) {
    if (taken[index]) continue;
    let sx = 0;
    let sy = 0;
    let count = 0;
    for (let other = index; other < raw.length; other += 1) {
      if (taken[other]) continue;
      if (Math.hypot(raw[other].x - raw[index].x, raw[other].y - raw[index].y) > 4) continue;
      taken[other] = 1;
      sx += raw[other].x;
      sy += raw[other].y;
      count += 1;
    }
    mids.push({ x: sx / count, y: sy / count });
  }
  const mcell = 12;
  const mgrid = new Map();
  mids.forEach((point, index) => {
    const key = `${Math.round(point.x / mcell)}:${Math.round(point.y / mcell)}`;
    if (!mgrid.has(key)) mgrid.set(key, []);
    mgrid.get(key).push(index);
  });
  const used = new Uint8Array(mids.length);
  const extend = (chain) => {
    for (;;) {
      const current = mids[chain[chain.length - 1]];
      const prev = chain.length > 1 ? mids[chain[chain.length - 2]] : null;
      let best = -1;
      let bestD = 14;
      const cx = Math.round(current.x / mcell);
      const cy = Math.round(current.y / mcell);
      for (let dx = -2; dx <= 2; dx += 1) {
        for (let dy = -2; dy <= 2; dy += 1) {
          for (const other of mgrid.get(`${cx + dx}:${cy + dy}`) || []) {
            if (used[other]) continue;
            const distance = Math.hypot(mids[other].x - current.x, mids[other].y - current.y);
            if (distance >= bestD) continue;
            if (prev) {
              const vx = current.x - prev.x;
              const vy = current.y - prev.y;
              const wx = mids[other].x - current.x;
              const wy = mids[other].y - current.y;
              const mag = Math.hypot(vx, vy) * Math.hypot(wx, wy);
              if (mag > 0 && (vx * wx + vy * wy) / mag < 0.45) continue;
            }
            bestD = distance;
            best = other;
          }
        }
      }
      if (best < 0) break;
      used[best] = 1;
      chain.push(best);
    }
  };
  const lanes = [];
  for (let start = 0; start < mids.length; start += 1) {
    if (used[start]) continue;
    used[start] = 1;
    const chain = [start];
    extend(chain);
    chain.reverse();
    extend(chain);
    if (chain.length < 3) continue;
    let length = 0;
    for (let index = 1; index < chain.length; index += 1) {
      length += Math.hypot(mids[chain[index]].x - mids[chain[index - 1]].x, mids[chain[index]].y - mids[chain[index - 1]].y);
    }
    if (length < 16) continue;
    const poly = chain.map((index) => ({ lat: toLat(mids[index].y), lng: toLng(mids[index].x) }));
    let joins = 0;
    const startRoad = nearestRoad(mids[chain[0]].x, mids[chain[0]].y, 34);
    const endRoad = nearestRoad(mids[chain[chain.length - 1]].x, mids[chain[chain.length - 1]].y, 34);
    if (startRoad) {
      poly.unshift({ lat: startRoad.lat, lng: startRoad.lng });
      joins += 1;
    }
    if (endRoad) {
      poly.push({ lat: endRoad.lat, lng: endRoad.lng });
      joins += 1;
    }
    if (!joins) continue;
    lanes.push(poly);
  }
  return lanes;
}

const laneLines = smallLanes(lines);
laneLines.forEach((lane) => lines.push(lane));
console.log('small lanes', laneLines.length);

const seenAt = new Map();
for (const line of lines) {
  if (line.length < 2) continue;
  for (const point of line) {
    const key = keyOf(point.lat, point.lng);
    seenAt.set(key, (seenAt.get(key) || 0) + 1);
  }
}

const nodes = new Map();
const adj = new Map();
let edgeCount = 0;

function addUndirected(points) {
  if (points.length < 2) return;
  const a = points[0];
  const b = points[points.length - 1];
  const ak = keyOf(a.lat, a.lng);
  const bk = keyOf(b.lat, b.lng);
  if (ak === bk) return;
  nodes.set(ak, a);
  nodes.set(bk, b);
  let length = 0;
  for (let i = 1; i < points.length; i += 1) length += meters(points[i - 1], points[i]);
  if (length < 4) return;
  const forward = { to: bk, points, length, used: false };
  const backward = { to: ak, points: [...points].reverse(), length, used: false };
  forward.twin = backward;
  backward.twin = forward;
  if (!adj.has(ak)) adj.set(ak, []);
  if (!adj.has(bk)) adj.set(bk, []);
  adj.get(ak).push(forward);
  adj.get(bk).push(backward);
  edgeCount += 1;
}

for (const line of lines) {
  if (line.length < 2) continue;
  let run = [line[0]];
  for (let i = 1; i < line.length; i += 1) {
    run.push(line[i]);
    const key = keyOf(line[i].lat, line[i].lng);
    const split = i === line.length - 1 || (seenAt.get(key) || 0) > 1;
    if (split) {
      addUndirected(run);
      run = [line[i]];
    }
  }
}

function dijkstra(start) {
  const dist = new Map([[start, 0]]);
  const prev = new Map();
  const heap = [];
  const push = (cost, node) => {
    heap.push({ cost, node });
    let i = heap.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (heap[parent].cost <= heap[i].cost) break;
      [heap[parent], heap[i]] = [heap[i], heap[parent]];
      i = parent;
    }
  };
  const pop = () => {
    if (!heap.length) return null;
    const top = heap[0];
    const last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const left = i * 2 + 1;
        const right = left + 1;
        let small = i;
        if (left < heap.length && heap[left].cost < heap[small].cost) small = left;
        if (right < heap.length && heap[right].cost < heap[small].cost) small = right;
        if (small === i) break;
        [heap[small], heap[i]] = [heap[i], heap[small]];
        i = small;
      }
    }
    return top;
  };
  push(0, start);
  while (heap.length) {
    const item = pop();
    if (!item || item.cost !== dist.get(item.node)) continue;
    for (const edge of adj.get(item.node) || []) {
      if (edge.extra) continue;
      const next = item.cost + edge.length;
      if (next < (dist.get(edge.to) ?? Infinity)) {
        dist.set(edge.to, next);
        prev.set(edge.to, { from: item.node, edge });
        push(next, edge.to);
      }
    }
  }
  return { dist, prev };
}

const odd = [...adj.keys()].filter((node) => (adj.get(node).length % 2) === 1);
const remaining = new Set(odd);
let added = 0;
while (remaining.size > 1) {
  const start = remaining.values().next().value;
  const { dist, prev } = dijkstra(start);
  let best = null;
  let bestDist = Infinity;
  for (const other of remaining) {
    if (other === start) continue;
    const length = dist.get(other);
    if (length != null && length < bestDist) {
      best = other;
      bestDist = length;
    }
  }
  if (!best) {
    remaining.delete(start);
    continue;
  }
  const chain = [];
  let cursor = best;
  while (cursor !== start) {
    const step = prev.get(cursor);
    if (!step) break;
    chain.push(step.edge);
    cursor = step.from;
  }
  chain.reverse();
  for (const edge of chain) {
    const points = edge.points;
    const copyF = { to: edge.to, points, length: edge.length, used: false, extra: true };
    const copyB = { to: keyOf(points[0].lat, points[0].lng), points: [...points].reverse(), length: edge.length, used: false, extra: true };
    copyF.twin = copyB;
    copyB.twin = copyF;
    adj.get(keyOf(points[0].lat, points[0].lng)).push(copyF);
    adj.get(edge.to).push(copyB);
    added += 1;
  }
  remaining.delete(start);
  remaining.delete(best);
}

function tourFrom(start) {
  const nodeStack = [start];
  const edgeStack = [];
  const finished = [];
  while (nodeStack.length) {
    const node = nodeStack[nodeStack.length - 1];
    const next = (adj.get(node) || []).find((edge) => !edge.used);
    if (next) {
      next.used = true;
      if (next.twin) next.twin.used = true;
      nodeStack.push(next.to);
      edgeStack.push(next);
    } else {
      nodeStack.pop();
      if (edgeStack.length) finished.push(edgeStack.pop());
    }
  }
  finished.reverse();
  return finished.map((edge) => edge.points);
}

const pieces = [];
let startNode = [...adj.keys()].find((node) => (adj.get(node) || []).some((edge) => !edge.used));
while (startNode) {
  const trail = tourFrom(startNode);
  const poly = [];
  for (const points of trail) {
    for (const point of points) {
      const prev = poly[poly.length - 1];
      if (!prev || meters(prev, point) >= 1) poly.push(point);
    }
  }
  if (poly.length >= 2) pieces.push(poly);
  startNode = [...adj.keys()].find((node) => (adj.get(node) || []).some((edge) => !edge.used));
}

async function roadBetween(from, to) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
  const response = await fetch(url, { headers: { 'User-Agent': 'bswml-ward-demo/1.0 (local prototype)' } });
  if (!response.ok) return [];
  const data = await response.json();
  const coords = data.routes?.[0]?.geometry?.coordinates || [];
  return coords.map(([lng, lat]) => ({ lat, lng }));
}

function nearestJoin(routePts, poly) {
  let best = { gap: Infinity, routeIndex: 0, atStart: true };
  for (let i = 0; i < routePts.length; i += 1) {
    const toStart = meters(routePts[i], poly[0]);
    const toEnd = meters(routePts[i], poly[poly.length - 1]);
    if (toStart < best.gap) best = { gap: toStart, routeIndex: i, atStart: true };
    if (toEnd < best.gap) best = { gap: toEnd, routeIndex: i, atStart: false };
  }
  return best;
}

const pool = pieces.slice();
const longest = pool.reduce((best, poly, index) => (poly.length > pool[best].length ? index : best), 0);
const routePts = [...pool.splice(longest, 1)[0]];
let stitchGap = 0;
while (pool.length) {
  let choice = null;
  pool.forEach((poly, index) => {
    const join = nearestJoin(routePts, poly);
    if (!choice || join.gap < choice.join.gap) choice = { index, poly, join };
  });
  const seq = choice.join.atStart ? choice.poly : [...choice.poly].reverse();
  const anchor = routePts[choice.join.routeIndex];
  let connector = [];
  if (choice.join.gap > 30) connector = await roadBetween(anchor, seq[0]);
  const returning = connector.length > 1 ? [...connector].reverse() : [anchor];
  const detour = [...(connector.length ? connector.slice(1) : []), ...seq, ...returning.slice(1)];
  routePts.splice(choice.join.routeIndex + 1, 0, ...detour);
  pool.splice(choice.index, 1);
  stitchGap = Math.max(stitchGap, choice.join.gap);
}

const route = [];
for (const point of routePts) {
  const prev = route[route.length - 1];
  if (!prev || meters({ lat: prev[0], lng: prev[1] }, point) >= 8) {
    route.push([Number(point.lat.toFixed(5)), Number(point.lng.toFixed(5))]);
  }
}

let maxGap = 0;
for (let i = 1; i < route.length; i += 1) {
  maxGap = Math.max(maxGap, meters(
    { lat: route[i - 1][0], lng: route[i - 1][1] },
    { lat: route[i][0], lng: route[i][1] },
  ));
}

const places = JSON.parse(readFileSync('src/data/ward39Places.json', 'utf8')).places;
const cell = 0.0004;
const grid = new Map();
route.forEach(([lat, lng]) => {
  const key = `${Math.round(lat / cell)}:${Math.round(lng / cell)}`;
  if (!grid.has(key)) grid.set(key, []);
  grid.get(key).push({ lat, lng });
});
let near = 0;
for (const place of places) {
  const cx = Math.round(place.lat / cell);
  const cy = Math.round(place.lng / cell);
  let best = Infinity;
  for (let dx = -1; dx <= 1; dx += 1) {
    for (let dy = -1; dy <= 1; dy += 1) {
      for (const point of grid.get(`${cx + dx}:${cy + dy}`) || []) {
        best = Math.min(best, meters(place, point));
      }
    }
  }
  if (best <= 32) near += 1;
}

geometry.route = route;
writeFileSync('src/data/ward57ClientGeometry.json', JSON.stringify(geometry));
console.log(JSON.stringify({
  ways: (payload.elements || []).length,
  edges: edgeCount,
  odd: odd.length,
  added,
  pieces: pieces.length,
  route: route.length,
  maxGap: Math.round(maxGap),
  stitchGap: Math.round(stitchGap),
  placesNear: near,
  places: places.length,
}));
