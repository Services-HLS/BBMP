/**
 * Places house dots along real streets in Ward 57 — C.V. Raman Nagar.
 * Writes a compact JSON file the admin map can draw.
 */
import { writeFileSync } from 'node:fs';

const SOUTH = 12.9738;
const NORTH = 12.9922;
const WEST = 77.6532;
const EAST = 77.6798;
const TARGET = 10000;

function inside(lat, lng) {
  return lat >= SOUTH && lat <= NORTH && lng >= WEST && lng <= EAST;
}

function toMeters(lat, lng) {
  return [
    lng * 111320 * Math.cos((lat * Math.PI) / 180),
    lat * 111320,
  ];
}

function fromMeters(x, y, latRef) {
  return [
    y / 111320,
    x / (111320 * Math.cos((latRef * Math.PI) / 180)),
  ];
}

function sampleRoads(coords) {
  const points = [];
  for (let i = 1; i < coords.length; i += 1) {
    const [lng1, lat1] = coords[i - 1];
    const [lng2, lat2] = coords[i];
    const [x1, y1] = toMeters(lat1, lng1);
    const [x2, y2] = toMeters(lat2, lng2);
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.hypot(dx, dy);
    if (length < 8) continue;
    const step = 8;
    const count = Math.floor(length / step);
    const px = -dy / length;
    const py = dx / length;
    for (let s = 0; s <= count; s += 1) {
      const t = Math.min(1, (s * step) / length);
      const x = x1 + dx * t;
      const y = y1 + dy * t;
      for (const side of [-10, 10, -20, 20, -30, 30, -40, 40]) {
        const [lat, lng] = fromMeters(x + px * side, y + py * side, lat1);
        if (inside(lat, lng)) points.push([Number(lat.toFixed(5)), Number(lng.toFixed(5))]);
      }
    }
  }
  return points;
}

async function route(a, b) {
  const url = `https://router.project-osrm.org/route/v1/driving/${a[1]},${a[0]};${b[1]},${b[0]}?overview=full&geometries=geojson`;
  const response = await fetch(url);
  if (!response.ok) return [];
  const data = await response.json();
  return data.routes?.[0]?.geometry?.coordinates || [];
}

const pairs = [];
for (let i = 0; i < 14; i += 1) {
  const lat = SOUTH + ((NORTH - SOUTH) * (i + 0.5)) / 14;
  pairs.push([[lat, WEST + 0.001], [lat, EAST - 0.001]]);
}
for (let i = 0; i < 12; i += 1) {
  const lng = WEST + ((EAST - WEST) * (i + 0.5)) / 12;
  pairs.push([[SOUTH + 0.001, lng], [NORTH - 0.001, lng]]);
}

const seen = new Set();
const houses = [];
for (const [start, end] of pairs) {
  if (houses.length >= TARGET) break;
  try {
    const line = await route(start, end);
    for (const point of sampleRoads(line)) {
      const key = `${Math.round(point[0] * 9000)},${Math.round(point[1] * 9000)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      houses.push(point);
      if (houses.length >= TARGET) break;
    }
    process.stdout.write(`roads ${houses.length}\n`);
  } catch {
    process.stdout.write('skip\n');
  }
}

const streetCount = houses.length;
let pad = 0;
while (houses.length < TARGET && pad < streetCount * 20) {
  const [lat, lng] = houses[pad % streetCount];
  const ring = 0.00014 * (1 + (pad % 4));
  const angle = ((pad % 8) / 8) * Math.PI * 2;
  const lat2 = Number((lat + Math.cos(angle) * ring).toFixed(5));
  const lng2 = Number((lng + Math.sin(angle) * ring).toFixed(5));
  pad += 1;
  if (!inside(lat2, lng2)) continue;
  const key = `${Math.round(lat2 * 9000)},${Math.round(lng2 * 9000)}`;
  if (seen.has(key)) continue;
  seen.add(key);
  houses.push([lat2, lng2]);
}
if (houses.length < TARGET) {
  throw new Error(`Only placed ${houses.length} houses`);
}

writeFileSync(
  new URL('../src/data/ward57Houses.json', import.meta.url),
  JSON.stringify({ ward: 57, name: 'C.V. Raman Nagar', count: houses.length, houses }),
);
console.log('wrote', houses.length);
