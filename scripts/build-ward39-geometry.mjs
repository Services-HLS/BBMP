/**
 * Official Mahalakshmi Layout outline and a real street route through it.
 * The neighbourhood is the BBMP ward named Mahalakshimpuram.
 * The demo labels this as BSWML Package P11, Ward 39.
 */
import { writeFileSync } from 'node:fs';

const SOURCE = 'https://raw.githubusercontent.com/datameet/Municipal_Spatial_Data/master/Bangalore/BBMP.geojson';

function toMeters(lat, lng) {
  return [lng * 111320 * Math.cos((lat * Math.PI) / 180), lat * 111320];
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
const ward = wardFile.features.find((feature) => feature.properties.KGISWardName === 'Mahalakshimpuram');
if (!ward) throw new Error('Mahalakshimpuram ward was not in the city ward file');
const raw = ward.geometry.coordinates[0];
const boundary = [[Number(raw[0][1].toFixed(5)), Number(raw[0][0].toFixed(5))]];
for (const [lng, lat] of raw) {
  const prev = boundary[boundary.length - 1];
  const [x1, y1] = toMeters(prev[0], prev[1]);
  const [x2, y2] = toMeters(lat, lng);
  if (Math.hypot(x2 - x1, y2 - y1) >= 28) {
    boundary.push([Number(lat.toFixed(5)), Number(lng.toFixed(5))]);
  }
}
const end = raw[raw.length - 1];
const last = [Number(end[1].toFixed(5)), Number(end[0].toFixed(5))];
if (last[0] !== boundary[boundary.length - 1][0] || last[1] !== boundary[boundary.length - 1][1]) {
  boundary.push(last);
}
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
for (let lat = south; lat <= north; lat += 0.0016) {
  for (let lng = west; lng <= east; lng += 0.0016) {
    if (inside(lat, lng)) grid.push([Number(lat.toFixed(5)), Number(lng.toFixed(5))]);
  }
}
const rows = new Map();
grid.forEach((point) => {
  const key = Math.round(point[0] * 600);
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
const route = [[Number(line[0][0].toFixed(5)), Number(line[0][1].toFixed(5))]];
for (const point of line.slice(1)) {
  const prev = route[route.length - 1];
  const [x1, y1] = toMeters(prev[0], prev[1]);
  const [x2, y2] = toMeters(point[0], point[1]);
  if (Math.hypot(x2 - x1, y2 - y1) >= 14) {
    route.push([Number(point[0].toFixed(5)), Number(point[1].toFixed(5))]);
  }
}

const landmark = inside(13.01132, 77.5447);
writeFileSync('src/data/ward57ClientGeometry.json', JSON.stringify({
  name: 'Mahalakshmi Layout',
  ward: 39,
  package: 'P11',
  outline: boundary,
  route,
}));
console.log('outline', boundary.length, 'route', route.length, 'landmark inside', landmark, 'bbox', south.toFixed(4), north.toFixed(4), west.toFixed(4), east.toFixed(4));
