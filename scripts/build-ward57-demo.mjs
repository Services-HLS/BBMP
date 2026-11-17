/**
 * Official C.V. Raman Nagar ward outline, 500 houses on its streets,
 * and the road the demo auto drives.
 * Source: BBMP ward boundaries (datameet), ward name "C V Raman Nagar".
 */
import { writeFileSync } from 'node:fs';

const SOURCE = 'https://raw.githubusercontent.com/datameet/Municipal_Spatial_Data/master/Bangalore/BBMP.geojson';

function toMeters(lat, lng) {
  return [lng * 111320 * Math.cos((lat * Math.PI) / 180), lat * 111320];
}

function fromMeters(x, y, latRef) {
  return [y / 111320, x / (111320 * Math.cos((latRef * Math.PI) / 180))];
}

function makeInside(boundary) {
  return (lat, lng) => {
    let hit = false;
    for (let i = 0, j = boundary.length - 1; i < boundary.length; j = i, i += 1) {
      const [latI, lngI] = boundary[i];
      const [latJ, lngJ] = boundary[j];
      const cross = ((lngI > lng) !== (lngJ > lng))
        && (lat < ((latJ - latI) * (lng - lngI)) / (lngJ - lngI) + latI);
      if (cross) hit = !hit;
    }
    return hit;
  };
}

async function drive(stops) {
  const coords = stops.map(([lat, lng]) => `${lng.toFixed(5)},${lat.toFixed(5)}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`OSRM ${response.status}`);
  const data = await response.json();
  if (data.code !== 'Ok') throw new Error(data.code || 'No route');
  return data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
}

const wardFile = await (await fetch(SOURCE)).json();
const ward = wardFile.features.find((feature) => feature.properties.KGISWardName === 'C V Raman Nagar');
if (!ward) throw new Error('C V Raman Nagar ward was not in the city ward file');
const raw = ward.geometry.coordinates[0];
const boundary = [[Number(raw[0][1].toFixed(5)), Number(raw[0][0].toFixed(5))]];
for (const [lng, lat] of raw) {
  const prev = boundary[boundary.length - 1];
  const [x1, y1] = toMeters(prev[0], prev[1]);
  const [x2, y2] = toMeters(lat, lng);
  if (Math.hypot(x2 - x1, y2 - y1) >= 35) {
    boundary.push([Number(lat.toFixed(5)), Number(lng.toFixed(5))]);
  }
}
const end = raw[raw.length - 1];
boundary.push([Number(end[1].toFixed(5)), Number(end[0].toFixed(5))]);
const inside = makeInside(boundary);

let south = 90;
let north = -90;
let west = 180;
let east = -180;
boundary.forEach(([lat, lng]) => {
  south = Math.min(south, lat);
  north = Math.max(north, lat);
  west = Math.min(west, lng);
  east = Math.max(east, lng);
});

const grid = [];
for (let lat = south; lat <= north; lat += 0.0018) {
  for (let lng = west; lng <= east; lng += 0.0018) {
    if (inside(lat, lng)) grid.push([Number(lat.toFixed(5)), Number(lng.toFixed(5))]);
  }
}
const rows = new Map();
grid.forEach((point) => {
  const key = Math.round(point[0] * 500);
  if (!rows.has(key)) rows.set(key, []);
  rows.get(key).push(point);
});
const stops = [];
[...rows.keys()].sort((a, b) => a - b).forEach((key, index) => {
  const row = rows.get(key).sort((a, b) => a[1] - b[1]);
  const ordered = index % 2 === 0 ? row : [...row].reverse();
  stops.push(ordered[0], ordered[ordered.length - 1]);
});
if (stops.length < 4) throw new Error(`Only ${stops.length} stops inside the ward`);

const line = await drive(stops);
const road = [[Number(line[0][0].toFixed(5)), Number(line[0][1].toFixed(5))]];
for (const point of line.slice(1)) {
  const prev = road[road.length - 1];
  const [x1, y1] = toMeters(prev[0], prev[1]);
  const [x2, y2] = toMeters(point[0], point[1]);
  if (Math.hypot(x2 - x1, y2 - y1) >= 16) {
    road.push([Number(point[0].toFixed(5)), Number(point[1].toFixed(5))]);
  }
}

const seen = new Set();
const houses = [];
for (let i = 1; i < line.length; i += 1) {
  const [lat1, lng1] = line[i - 1];
  const [lat2, lng2] = line[i];
  const [x1, y1] = toMeters(lat1, lng1);
  const [x2, y2] = toMeters(lat2, lng2);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy);
  if (length < 18) continue;
  const count = Math.floor(length / 18);
  const px = -dy / length;
  const py = dx / length;
  for (let s = 0; s <= count; s += 1) {
    const t = Math.min(1, (s * 18) / length);
    const x = x1 + dx * t;
    const y = y1 + dy * t;
    for (const side of [-16, 16]) {
      const [lat, lng] = fromMeters(x + px * side, y + py * side, lat1);
      if (!inside(lat, lng)) continue;
      const point = [Number(lat.toFixed(5)), Number(lng.toFixed(5))];
      const key = `${Math.round(point[0] * 8000)},${Math.round(point[1] * 8000)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      houses.push(point);
    }
  }
}
if (houses.length < 500) throw new Error(`Only placed ${houses.length} houses`);
const picked = [];
for (let i = 0; i < 500; i += 1) picked.push(houses[Math.floor((i * houses.length) / 500)]);

writeFileSync(new URL('../src/data/ward57Boundary.json', import.meta.url), JSON.stringify({
  name: 'C.V. Raman Nagar',
  source: 'BBMP ward boundary',
  ring: boundary,
}));
writeFileSync(new URL('../src/data/ward57Houses.json', import.meta.url), JSON.stringify({
  ward: 57,
  name: 'C.V. Raman Nagar',
  count: picked.length,
  houses: picked,
}));
writeFileSync(new URL('../src/data/ward57Route.json', import.meta.url), JSON.stringify({ path: road }));
console.log('boundary', boundary.length, 'houses', picked.length, 'road', road.length, 'candidates', houses.length);
