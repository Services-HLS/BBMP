/**
 * Real houses, shops and apartments inside Mahalakshmi Layout (Ward 39)
 * from OpenStreetMap. A door number is kept only when the public map lists one.
 */
import { readFileSync, writeFileSync } from 'node:fs';

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

const mapUrl = `https://api.openstreetmap.org/api/0.6/map?bbox=${west},${south},${east},${north}`;
const response = await fetch(mapUrl, {
  headers: { 'User-Agent': 'bswml-ward-demo/1.0 (local prototype)' },
});
if (!response.ok) throw new Error(`OSM ${response.status}`);
const xml = await response.text();
console.log('bytes', xml.length);

function tagsFrom(body) {
  const tags = {};
  for (const tag of body.matchAll(/<tag k="([^"]+)" v="([^"]*)"/g)) {
    tags[tag[1]] = tag[2]
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'");
  }
  return tags;
}

const nodes = new Map();
for (const match of xml.matchAll(/<node id="(-?\d+)"([^>]*)>([\s\S]*?)<\/node>/g)) {
  const lat = match[2].match(/lat="([^"]+)"/);
  const lon = match[2].match(/lon="([^"]+)"/);
  if (!lat || !lon) continue;
  nodes.set(match[1], { lat: Number(lat[1]), lon: Number(lon[1]), tags: tagsFrom(match[3]) });
}
for (const match of xml.matchAll(/<node id="(-?\d+)"([^>]*)\/>/g)) {
  if (nodes.has(match[1])) continue;
  const lat = match[2].match(/lat="([^"]+)"/);
  const lon = match[2].match(/lon="([^"]+)"/);
  if (!lat || !lon) continue;
  nodes.set(match[1], { lat: Number(lat[1]), lon: Number(lon[1]), tags: {} });
}

function kindOf(tags) {
  const building = String(tags.building || '');
  const amenity = String(tags.amenity || '');
  const shop = String(tags.shop || '');
  const label = `${tags.name || ''} ${amenity} ${building}`;
  if (/school|college|university|hospital|worship|temple|kindergarten|police/.test(label) && !shop) return '';
  if (shop || /retail|commercial|shop|supermarket/.test(building)) return 'shop';
  if (/cafe|restaurant|fast_food|bank|pharmacy|clinic|fuel|marketplace|bar|pub/.test(amenity)) return 'shop';
  if (/apart|flat|dorm/.test(building)) return 'apartment';
  if (building && !/grandstand|roof|construction|ruins|garage|shed|service|toilets|warehouse/.test(building)) return 'house';
  if (tags['addr:housenumber']) return 'house';
  return '';
}

function doorNumber(tags) {
  const raw = String(tags['addr:housenumber'] || '').replace(/\s+/g, ' ').trim();
  if (!raw || raw === '0') return '';
  const short = raw.split(',')[0].trim();
  if (!short || short.length > 16) return '';
  return short;
}

function placeName(tags, kind) {
  const name = String(tags.name || tags['addr:housename'] || '').replace(/\s+/g, ' ').trim();
  if (name && name !== 'yes') return name.slice(0, 40);
  if (kind === 'shop') return String(tags.shop || tags.amenity || '').replace(/_/g, ' ').slice(0, 40);
  return '';
}

function phoneOf(tags) {
  const raw = String(tags.phone || tags['contact:phone'] || tags['contact:mobile'] || tags.mobile || '')
    .replace(/\s+/g, ' ')
    .trim();
  return raw.slice(0, 24);
}

const found = [];
function addPlace(lat, lng, tags) {
  if (!inside(lat, lng)) return;
  const kind = kindOf(tags);
  if (!kind) return;
  found.push({
    lat,
    lng,
    kind,
    number: doorNumber(tags),
    name: placeName(tags, kind),
    phone: phoneOf(tags),
  });
}

for (const node of nodes.values()) {
  if (node.tags.building || node.tags.shop || node.tags.amenity || node.tags['addr:housenumber']) {
    addPlace(node.lat, node.lon, node.tags);
  }
}
for (const match of xml.matchAll(/<way [^>]*>([\s\S]*?)<\/way>/g)) {
  const body = match[1];
  const tags = tagsFrom(body);
  if (!tags.building && !tags.shop && !tags.amenity && !tags['addr:housenumber']) continue;
  const pts = [];
  for (const ref of body.matchAll(/<nd ref="(-?\d+)"/g)) {
    const node = nodes.get(ref[1]);
    if (node) pts.push(node);
  }
  if (!pts.length) continue;
  const lat = pts.reduce((sum, point) => sum + point.lat, 0) / pts.length;
  const lng = pts.reduce((sum, point) => sum + point.lon, 0) / pts.length;
  addPlace(lat, lng, tags);
}

const cell = 0.00012;
const grid = new Map();
const places = [];
const rank = { house: 1, apartment: 2, shop: 3 };
for (const place of found) {
  const cx = Math.round(place.lat / cell);
  const cy = Math.round(place.lng / cell);
  let match = -1;
  for (let dx = -1; dx <= 1 && match < 0; dx += 1) {
    for (let dy = -1; dy <= 1; dy += 1) {
      for (const index of grid.get(`${cx + dx}:${cy + dy}`) || []) {
        const other = places[index];
        const dLat = (other.lat - place.lat) * 110540;
        const dLng = (other.lng - place.lng) * 111320 * Math.cos((place.lat * Math.PI) / 180);
        if (Math.hypot(dLat, dLng) <= 5) {
          match = index;
          break;
        }
      }
      if (match >= 0) break;
    }
  }
  if (match >= 0) {
    const kept = places[match];
    if (rank[place.kind] > rank[kept.kind]) kept.kind = place.kind;
    if (!kept.number && place.number) kept.number = place.number;
    if ((!kept.name || kept.name === kept.kind) && place.name) kept.name = place.name;
    if (!kept.phone && place.phone) kept.phone = place.phone;
    continue;
  }
  const index = places.length;
  places.push({
    lat: Number(place.lat.toFixed(6)),
    lng: Number(place.lng.toFixed(6)),
    kind: place.kind,
    number: place.number,
    name: place.name,
    phone: place.phone,
  });
  const key = `${cx}:${cy}`;
  if (!grid.has(key)) grid.set(key, []);
  grid.get(key).push(index);
}

const counts = places.reduce((bag, place) => {
  bag[place.kind] = (bag[place.kind] || 0) + 1;
  if (place.number) bag.numbered = (bag.numbered || 0) + 1;
  if (place.phone) bag.withPhone = (bag.withPhone || 0) + 1;
  if (place.name) bag.withName = (bag.withName || 0) + 1;
  return bag;
}, { house: 0, apartment: 0, shop: 0, numbered: 0, withPhone: 0, withName: 0 });

writeFileSync('src/data/ward39Places.json', JSON.stringify({
  ward: 39,
  name: 'Mahalakshmi Layout',
  package: 'P11',
  source: 'OpenStreetMap',
  count: places.length,
  counts,
  places,
}));
console.log('inside', places.length, counts);
