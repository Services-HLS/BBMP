import { useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { loadGoogleMaps } from './MapView';
import geometry from '../../data/ward57ClientGeometry.json';
import placesFile from '../../data/ward39Places.json';

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const ZOOM = 18;
const PLACES = placesFile.places;
const VEHICLE = 'KA-01-AW-1057';
const COLORS = {
  ward: '#F6B423',
  casing: '#FFFFFF',
  route: '#1A73E8',
  driven: '#B0B6BE',
  auto: '#1FA86A',
  house: '#E53935',
};

const EARTH = 6371000;

function haversineMeters(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH * Math.asin(Math.sqrt(h));
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2;
}

function formatClock(minutesAfterMidnight) {
  const total = ((Math.round(minutesAfterMidnight) % 1440) + 1440) % 1440;
  const h24 = Math.floor(total / 60);
  const m = total % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${h24 < 12 ? 'am' : 'pm'}`;
}

function buildPath(pairs) {
  const points = pairs.map(([lat, lng]) => ({ lat, lng }));
  const cumulative = [0];
  for (let i = 1; i < points.length; i += 1) {
    cumulative.push(cumulative[i - 1] + haversineMeters(points[i - 1], points[i]));
  }
  const total = cumulative[cumulative.length - 1];
  const segmentAt = (distance) => {
    const d = Math.min(Math.max(distance, 0), total);
    let lo = 0;
    let hi = cumulative.length - 2;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (cumulative[mid] <= d) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  };
  const pointAt = (distance) => {
    const d = Math.min(Math.max(distance, 0), total);
    const i = segmentAt(d);
    const a = points[i];
    const b = points[i + 1];
    const seg = cumulative[i + 1] - cumulative[i];
    const t = seg > 0 ? (d - cumulative[i]) / seg : 0;
    const position = { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
    const x = (b.lng - a.lng) * Math.cos((a.lat * Math.PI) / 180);
    const y = b.lat - a.lat;
    const len = Math.hypot(x, y) || 1;
    return { position, direction: { x: x / len, y: y / len } };
  };
  const split = (distance) => {
    const d = Math.min(Math.max(distance, 0), total);
    const i = segmentAt(d);
    const here = pointAt(d).position;
    return {
      driven: [...points.slice(0, i + 1), here],
      ahead: [here, ...points.slice(i + 1)],
    };
  };
  return { points, total, pointAt, split };
}

const ROUTE = buildPath(geometry.route);
const OUTLINE = geometry.outline.map(([lat, lng]) => ({ lat, lng }));
const STREET_REACH = 22;
const CELL = 0.0003;
const routeCumulative = [0];
for (let i = 1; i < ROUTE.points.length; i += 1) {
  routeCumulative.push(routeCumulative[i - 1] + haversineMeters(ROUTE.points[i - 1], ROUTE.points[i]));
}
const segmentGrid = new Map();
for (let i = 1; i < ROUTE.points.length; i += 1) {
  const a = ROUTE.points[i - 1];
  const b = ROUTE.points[i];
  const x0 = Math.floor(Math.min(a.lat, b.lat) / CELL);
  const x1 = Math.floor(Math.max(a.lat, b.lat) / CELL);
  const y0 = Math.floor(Math.min(a.lng, b.lng) / CELL);
  const y1 = Math.floor(Math.max(a.lng, b.lng) / CELL);
  for (let x = x0; x <= x1; x += 1) {
    for (let y = y0; y <= y1; y += 1) {
      const key = `${x}:${y}`;
      if (!segmentGrid.has(key)) segmentGrid.set(key, []);
      segmentGrid.get(key).push(i);
    }
  }
}

function projectOnSegment(house, a, b) {
  const cos = Math.cos((a.lat * Math.PI) / 180);
  const bx = (b.lng - a.lng) * cos * 111320;
  const by = (b.lat - a.lat) * 110540;
  const px = (house.lng - a.lng) * cos * 111320;
  const py = (house.lat - a.lat) * 110540;
  const len2 = bx * bx + by * by;
  const t = len2 > 0 ? Math.max(0, Math.min(1, (px * bx + py * by) / len2)) : 0;
  return { t, distance: Math.hypot(px - bx * t, py - by * t) };
}

function nearestAlong(lat, lng) {
  const house = { lat, lng };
  const cx = Math.floor(lat / CELL);
  const cy = Math.floor(lng / CELL);
  let bestOffset = Infinity;
  let bestAlong = 0;
  const seen = new Set();
  for (let dx = -2; dx <= 2; dx += 1) {
    for (let dy = -2; dy <= 2; dy += 1) {
      const bucket = segmentGrid.get(`${cx + dx}:${cy + dy}`);
      if (!bucket) continue;
      for (const index of bucket) {
        if (seen.has(index)) continue;
        seen.add(index);
        const a = ROUTE.points[index - 1];
        const b = ROUTE.points[index];
        const proj = projectOnSegment(house, a, b);
        const seg = routeCumulative[index] - routeCumulative[index - 1];
        const along = routeCumulative[index - 1] + seg * proj.t;
        const closer = proj.distance + 1 < bestOffset;
        const earlierTie = proj.distance <= bestOffset + 1 && along < bestAlong;
        if (closer || earlierTie) {
          bestOffset = proj.distance;
          bestAlong = along;
        }
      }
    }
  }
  return { along: bestAlong, offset: bestOffset };
}

function stopLabel(place, number) {
  const title = place.kind === 'shop' ? 'Shop' : place.kind === 'apartment' ? 'Apartment' : 'House';
  const named = place.name && place.name !== 'yes' && !/^[a-z_ ]+$/.test(place.name);
  if (place.kind === 'shop' && named) return `${title} ${number} · ${place.name}`;
  return `${title} ${number}`;
}

function waitFor(kind) {
  return kind === 'house' ? 1 : 5;
}

function buildHouses() {
  const roadside = PLACES
    .map((place, placeIndex) => ({ place, placeIndex, ...nearestAlong(place.lat, place.lng) }))
    .filter((item) => item.offset <= STREET_REACH)
    .sort((a, b) => a.along - b.along || a.placeIndex - b.placeIndex);
  const picked = [];
  for (const item of roadside) {
    const previous = picked[picked.length - 1];
    if (previous && haversineMeters(
      { lat: previous.place.lat, lng: previous.place.lng },
      { lat: item.place.lat, lng: item.place.lng },
    ) < 4) continue;
    picked.push(item);
  }
  if (!picked.length && PLACES[0]) picked.push({ place: PLACES[0], placeIndex: 0, along: 40 });
  let clock = 6 * 60 + 24;
  return picked.map((item, index) => {
    const n = index + 1;
    clock += 1;
    const waitMinutes = waitFor(item.place.kind);
    const stopDistance = item.along;
    const house = {
      number: n,
      placeIndex: item.placeIndex,
      label: stopLabel(item.place, n),
      door: String(n),
      placeKind: item.place.kind,
      stopDistance,
      position: { lat: item.place.lat, lng: item.place.lng },
      waitMinutes,
      arrivalMinutes: clock,
    };
    clock += waitMinutes;
    return house;
  });
}

const HOUSES = buildHouses();
const demoByPlace = new Int32Array(PLACES.length);
for (const house of HOUSES) demoByPlace[house.placeIndex] = house.number;
export const demoNumbers = demoByPlace;
const placeStatus = new Uint8Array(PLACES.length);
const scheduledPlaces = new Set(HOUSES.map((house) => house.placeIndex));
let dotPaint = [];

function paintDots() {
  dotPaint.forEach((overlay) => overlay.draw());
}

function markPlace(index, state) {
  if (index == null || index < 0 || placeStatus[index] === state) return false;
  placeStatus[index] = state;
  return true;
}

function markCluster(index, state) {
  const origin = PLACES[index];
  let changed = markPlace(index, state);
  if (!origin) {
    if (changed) paintDots();
    return;
  }
  const here = { lat: origin.lat, lng: origin.lng };
  for (let i = 0; i < PLACES.length; i += 1) {
    if (scheduledPlaces.has(i) || placeStatus[i] >= state) continue;
    const place = PLACES[i];
    if (haversineMeters(here, { lat: place.lat, lng: place.lng }) <= 14) {
      changed = markPlace(i, state) || changed;
    }
  }
  if (changed) paintDots();
}

function createOverlay(map, position, content, zIndex) {
  const wrapper = document.createElement('div');
  wrapper.style.position = 'absolute';
  wrapper.style.left = '0';
  wrapper.style.top = '0';
  wrapper.style.zIndex = String(zIndex);
  wrapper.style.willChange = 'transform';
  wrapper.appendChild(content);
  let current = position;
  const Overlay = class extends window.google.maps.OverlayView {
    onAdd() { this.getPanes()?.floatPane.appendChild(wrapper); }
    draw() {
      const projection = this.getProjection();
      if (!projection) return;
      const pt = projection.fromLatLngToDivPixel(new window.google.maps.LatLng(current.lat, current.lng));
      if (pt) wrapper.style.transform = `translate3d(${pt.x}px, ${pt.y}px, 0)`;
    }
    onRemove() { wrapper.remove(); }
  };
  const overlay = new Overlay();
  overlay.setMap(map);
  return {
    setPosition(next) { current = next; overlay.draw(); },
    remove() { overlay.setMap(null); },
  };
}

function placeDotsOverlay() {
  const Overlay = class extends window.google.maps.OverlayView {
    onAdd() {
      this.canvas = document.createElement('canvas');
      this.canvas.style.position = 'absolute';
      this.canvas.style.pointerEvents = 'none';
      this.getPanes().overlayLayer.appendChild(this.canvas);
    }

    draw() {
      if (!this.canvas) return;
      const projection = this.getProjection();
      const bounds = this.getMap()?.getBounds();
      if (!projection || !bounds) return;
      const sw = projection.fromLatLngToDivPixel(bounds.getSouthWest());
      const ne = projection.fromLatLngToDivPixel(bounds.getNorthEast());
      const left = Math.min(sw.x, ne.x);
      const top = Math.min(sw.y, ne.y);
      const width = Math.max(1, Math.abs(ne.x - sw.x));
      const height = Math.max(1, Math.abs(ne.y - sw.y));
      this.canvas.style.left = `${left}px`;
      this.canvas.style.top = `${top}px`;
      this.canvas.width = width;
      this.canvas.height = height;
      const ctx = this.canvas.getContext('2d');
      ctx.clearRect(0, 0, width, height);
      const radius = (this.getMap()?.getZoom() || 15) >= 17 ? 3.2 : 1.8;
      const south = bounds.getSouthWest().lat();
      const north = bounds.getNorthEast().lat();
      const west = bounds.getSouthWest().lng();
      const east = bounds.getNorthEast().lng();
      for (let i = 0; i < PLACES.length; i += 1) {
        const place = PLACES[i];
        if (place.lat < south || place.lat > north || place.lng < west || place.lng > east) continue;
        const pixel = projection.fromLatLngToDivPixel(new window.google.maps.LatLng(place.lat, place.lng));
        const x = pixel.x - left;
        const y = pixel.y - top;
        if (x < -4 || y < -4 || x > width + 4 || y > height + 4) continue;
        const state = placeStatus[i];
        ctx.beginPath();
        if (state === 1) ctx.fillStyle = '#E53935';
        else if (state === 2) ctx.fillStyle = '#1FA86A';
        else if (place.kind === 'shop') ctx.fillStyle = '#FF6D00';
        else if (place.kind === 'apartment') ctx.fillStyle = '#7E57C2';
        else ctx.fillStyle = '#F6B423';
        const dot = state === 0 ? radius : radius + 1.4;
        ctx.arc(x, y, place.kind === 'shop' && state === 0 ? dot + 0.6 : dot, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    onRemove() {
      this.canvas?.remove();
      this.canvas = null;
    }
  };
  return new Overlay();
}

function routeIndex(distance) {
  const total = routeCumulative[routeCumulative.length - 1] || 0;
  const d = Math.min(Math.max(distance, 0), total);
  let lo = 0;
  let hi = Math.max(0, routeCumulative.length - 2);
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (routeCumulative[mid] <= d) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

function routeColorOverlay(weights) {
  let traveled = 0;
  const Overlay = class extends window.google.maps.OverlayView {
    onAdd() {
      this.canvas = document.createElement('canvas');
      this.canvas.style.position = 'absolute';
      this.canvas.style.pointerEvents = 'none';
      this.getPanes().overlayLayer.appendChild(this.canvas);
    }

    draw() {
      if (!this.canvas) return;
      const projection = this.getProjection();
      const bounds = this.getMap()?.getBounds();
      if (!projection || !bounds) return;
      const sw = projection.fromLatLngToDivPixel(bounds.getSouthWest());
      const ne = projection.fromLatLngToDivPixel(bounds.getNorthEast());
      const left = Math.min(sw.x, ne.x);
      const top = Math.min(sw.y, ne.y);
      const width = Math.max(1, Math.abs(ne.x - sw.x));
      const height = Math.max(1, Math.abs(ne.y - sw.y));
      this.canvas.style.left = `${left}px`;
      this.canvas.style.top = `${top}px`;
      this.canvas.width = width;
      this.canvas.height = height;
      const ctx = this.canvas.getContext('2d');
      ctx.clearRect(0, 0, width, height);
      const pixels = ROUTE.points.map((point) => {
        const pixel = projection.fromLatLngToDivPixel(new window.google.maps.LatLng(point.lat, point.lng));
        return [pixel.x - left, pixel.y - top];
      });
      const here = ROUTE.pointAt(traveled).position;
      const herePixel = projection.fromLatLngToDivPixel(new window.google.maps.LatLng(here.lat, here.lng));
      const cut = routeIndex(traveled);
      const done = pixels.slice(0, cut + 1);
      done.push([herePixel.x - left, herePixel.y - top]);
      const stroke = (path, color, width) => {
        if (path.length < 2) return;
        ctx.beginPath();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.moveTo(path[0][0], path[0][1]);
        for (let i = 1; i < path.length; i += 1) ctx.lineTo(path[i][0], path[i][1]);
        ctx.stroke();
      };
      stroke(pixels, '#FFFFFF', weights.casing);
      stroke(pixels, COLORS.route, weights.route);
      stroke(done, '#FFFFFF', weights.casing);
      stroke(done, COLORS.driven, weights.driven);
    }

    onRemove() {
      this.canvas?.remove();
      this.canvas = null;
    }
  };
  const overlay = new Overlay();
  return {
    setMap(map) { overlay.setMap(map); },
    setTraveled(distance) {
      traveled = distance;
      overlay.draw();
    },
    remove() { overlay.setMap(null); },
  };
}

function formatCoord(point) {
  return `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`;
}

function autoMarker() {
  const el = document.createElement('div');
  el.style.cssText = 'position:relative;width:0;height:0;--heading:0deg;transition:opacity 400ms ease';
  el.innerHTML = `<span style="position:absolute;left:0;top:0;width:40px;height:40px;border-radius:999px;transform:translate(-50%,-50%);background:rgba(31,168,106,.22);border:1.5px solid rgba(31,168,106,.55)"></span>
    <span style="position:absolute;left:0;top:0;width:40px;height:40px;border-radius:999px;transform:translate(-50%,-50%);background:rgba(31,168,106,.35);animation:bswml-auto-pulse 1.8s ease-out infinite"></span>
    <img class="bswml-auto-body" src="/auto-marker.png" alt="" draggable="false" style="position:absolute;left:0;top:0;width:42px;height:auto;transform:translate(-50%,-50%) rotate(var(--heading));filter:drop-shadow(0 2px 3px rgba(20,35,58,.4));user-select:none" />`;
  return el;
}

function setHeading(el, direction) {
  const deg = (Math.atan2(-direction.y, direction.x) * 180) / Math.PI;
  el.style.setProperty('--heading', `${deg.toFixed(1)}deg`);
}

function housePin() {
  const root = document.createElement('div');
  root.style.cssText = 'display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);transition:opacity 450ms ease, translate 450ms ease;opacity:0;translate:0 -6px;pointer-events:none';
  root.innerHTML = `<div style="position:relative;margin-bottom:6px;display:flex;align-items:center;background:#fff;border-radius:999px;box-shadow:0 8px 24px rgba(16,24,32,.16);font:700 12px 'Plus Jakarta Sans',sans-serif">
      <span class="bswml-pin-label" style="padding:5px 8px 5px 11px;color:#143A4F"></span>
      <span class="bswml-pin-eta" style="margin:2px;padding:3px 9px;border-radius:999px;background:#1A3F8B;color:#fff"></span>
    </div>
    <svg viewBox="0 0 28 36" width="26" height="34" style="filter:drop-shadow(0 3px 4px rgba(20,35,58,.35))">
      <path fill="${COLORS.house}" stroke="#fff" stroke-width="1.6" d="M14 35s11-11.6 11-20.4C25 8 20.1 3 14 3S3 8 3 14.6C3 23.4 14 35 14 35Z"/>
      <circle fill="#fff" cx="14" cy="14.5" r="4.2"/>
    </svg>`;
  const label = root.querySelector('.bswml-pin-label');
  const eta = root.querySelector('.bswml-pin-eta');
  return {
    root,
    show(on) {
      root.style.opacity = on ? '1' : '0';
      root.style.translate = on ? '0 0' : '0 -6px';
    },
    setLabel(text) { label.textContent = text; },
    setEta(text) {
      eta.textContent = text;
      eta.style.display = text ? 'inline' : 'none';
    },
  };
}

function smallAuto() {
  const el = document.createElement('div');
  el.style.cssText = 'width:22px;height:22px;border-radius:999px;background:#fff;display:grid;place-items:center;transform:translate(-50%,-50%);box-shadow:0 2px 6px rgba(0,0,0,.35)';
  el.innerHTML = `<svg viewBox="0 0 32 32" width="14" height="14"><path fill="${COLORS.auto}" d="M5 21.5V14c0-4.4 3.6-8 8-8h6.2l4.6 6.2h2.4c1.2 0 2.2 1 2.2 2.2v7.1Z"/><circle fill="#14233A" cx="10" cy="23" r="3"/><circle fill="#14233A" cx="23.5" cy="23" r="3"/></svg>`;
  return el;
}

function TypeToggle({ value, onChange }) {
  const button = (id, label) => (
    <Box
      component="button"
      type="button"
      onClick={() => onChange(id)}
      sx={{
        border: 0,
        cursor: 'pointer',
        px: 1.1,
        py: 0.4,
        fontSize: 12,
        fontWeight: 700,
        borderRadius: '6px',
        bgcolor: value === id ? '#F6B423' : '#fff',
        color: value === id ? '#1A3F8B' : '#3C4043',
      }}
    >
      {label}
    </Box>
  );
  return (
    <Box sx={{ position: 'absolute', top: 10, right: 10, zIndex: 2, display: 'flex', gap: 0.5, p: 0.4, bgcolor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,.2)' }}>
      {button('roadmap', 'Map')}
      {button('satellite', 'Satellite')}
    </Box>
  );
}

export default function Ward57ClientMap({ onProgress }) {
  const trackRef = useRef(null);
  const overviewRef = useRef(null);
  const trackMapRef = useRef(null);
  const overviewMapRef = useRef(null);
  const progressRef = useRef(onProgress);
  progressRef.current = onProgress;
  const [kind, setKind] = useState('satellite');
  const [overviewKind, setOverviewKind] = useState('satellite');
  const [status, setStatus] = useState({
    kind: 'driving',
    label: HOUSES[0].label,
    door: HOUSES[0].door,
    placeKind: HOUSES[0].placeKind,
    minutes: HOUSES[0].waitMinutes,
    clock: formatClock(HOUSES[0].arrivalMinutes - 1),
    distance: '—',
    collected: 0,
    houseNo: 1,
  });
  const barRef = useRef(null);
  const distanceRef = useRef(null);
  const houseCoordRef = useRef(null);
  const autoCoordRef = useRef(null);

  useEffect(() => {
    if (!MAPS_KEY) return undefined;
    let cancelled = false;
    const timers = new Set();
    const cleanups = [];
    const sleep = (ms) => new Promise((resolve) => {
      const id = setTimeout(() => { timers.delete(id); resolve(); }, ms);
      timers.add(id);
    });
    const animate = (ms, step) => new Promise((resolve) => {
      if (ms <= 0) { step(1); resolve(); return; }
      let elapsed = 0;
      let last = performance.now();
      const frame = (now) => {
        if (cancelled) { resolve(); return; }
        elapsed += Math.min(now - last, 50);
        last = now;
        const t = Math.min(elapsed / ms, 1);
        step(t);
        if (t < 1) requestAnimationFrame(frame);
        else resolve();
      };
      requestAnimationFrame(frame);
    });

    loadGoogleMaps(MAPS_KEY).then(async () => {
      const trackEl = trackRef.current;
      const overviewEl = overviewRef.current;
      if (cancelled || !trackEl || !overviewEl || !window.google?.maps) return;
      const g = window.google.maps;
      const first = HOUSES[0];
      const trackMap = new g.Map(trackEl, {
        center: first.position,
        zoom: ZOOM,
        minZoom: ZOOM,
        maxZoom: ZOOM,
        mapTypeId: 'satellite',
        disableDefaultUI: true,
        gestureHandling: 'none',
        clickableIcons: false,
        tilt: 0,
      });
      const overviewMap = new g.Map(overviewEl, {
        center: ROUTE.points[0],
        zoom: 14,
        mapTypeId: 'satellite',
        disableDefaultUI: true,
        gestureHandling: 'greedy',
        clickableIcons: false,
        tilt: 0,
      });
      trackMapRef.current = trackMap;
      overviewMapRef.current = overviewMap;

      const trackRoute = routeColorOverlay({ casing: 12, route: 7, driven: 8 });
      const overviewRoute = routeColorOverlay({ casing: 5, route: 2.5, driven: 3.5 });
      trackRoute.setMap(trackMap);
      overviewRoute.setMap(overviewMap);
      const ring = [...OUTLINE, OUTLINE[0]];
      const edgeBase = new g.Polyline({ map: overviewMap, path: ring, strokeColor: COLORS.casing, strokeWeight: 5, strokeOpacity: 0.95, clickable: false, zIndex: 1 });
      const edge = new g.Polyline({
        map: overviewMap,
        path: ring,
        strokeOpacity: 0,
        clickable: false,
        zIndex: 2,
        icons: [{ icon: { path: 'M 0,-1 0,1', strokeColor: COLORS.ward, strokeOpacity: 1, strokeWeight: 2.5, scale: 2.2 }, offset: '0', repeat: '8px' }],
      });
      const bounds = new g.LatLngBounds();
      OUTLINE.forEach((point) => bounds.extend(point));
      overviewMap.fitBounds(bounds, 6);
      const trackDots = placeDotsOverlay();
      const overviewDots = placeDotsOverlay();
      trackDots.setMap(trackMap);
      overviewDots.setMap(overviewMap);
      dotPaint = [trackDots, overviewDots];
      placeStatus.fill(0);

      const pin = housePin();
      const pinOverlay = createOverlay(trackMap, first.position, pin.root, 30);
      const autoEl = autoMarker();
      const autoOverlay = createOverlay(trackMap, ROUTE.points[0], autoEl, 40);
      const overviewAuto = createOverlay(overviewMap, ROUTE.points[0], smallAuto(), 20);
      cleanups.push(() => {
        pinOverlay.remove();
        autoOverlay.remove();
        overviewAuto.remove();
        trackDots.setMap(null);
        overviewDots.setMap(null);
        dotPaint = [];
        trackRoute.remove();
        overviewRoute.remove();
        [edgeBase, edge].forEach((item) => item.setMap(null));
      });

      let target = { ...first.position };
      const cam = { ...first.position };
      let followId = 0;
      const follow = () => {
        if (cancelled) return;
        cam.lat += (target.lat - cam.lat) * 0.1;
        cam.lng += (target.lng - cam.lng) * 0.1;
        trackMap.moveCamera({ center: cam, zoom: ZOOM });
        followId = requestAnimationFrame(follow);
      };
      followId = requestAnimationFrame(follow);
      cleanups.push(() => cancelAnimationFrame(followId));

      let nextHouse = first.position;
      let legStart = 0;
      let legEnd = first.stopDistance;
      let autoDistance = 0;
      let collected = 0;
      let stopWait = first.waitMinutes;

      const publish = (next) => {
        if (cancelled) return;
        setStatus(next);
        progressRef.current?.({
          collected,
          missed: 0,
          done: false,
          phase: next.kind,
          label: next.label,
          waitMin: next.minutes,
          houseNo: next.houseNo,
        });
      };

      const placeAuto = (distance) => {
        autoDistance = distance;
        const { position } = ROUTE.pointAt(distance);
        autoOverlay.setPosition(position);
        overviewAuto.setPosition(position);
        const back = ROUTE.pointAt(distance - 5).position;
        const front = ROUTE.pointAt(distance + 5).position;
        const x = (front.lng - back.lng) * Math.cos((position.lat * Math.PI) / 180);
        const y = front.lat - back.lat;
        if (Math.hypot(x, y) > 0) setHeading(autoEl, { x, y });
        trackRoute.setTraveled(distance);
        overviewRoute.setTraveled(distance);
        target = {
          lat: position.lat + (nextHouse.lat - position.lat) * 0.3,
          lng: position.lng + (nextHouse.lng - position.lng) * 0.3,
        };
        const left = Math.max(legEnd - distance, 0);
        const span = Math.max(legEnd - legStart, 1);
        if (barRef.current) barRef.current.style.width = `${Math.min(100, ((distance - legStart) / span) * 100)}%`;
        if (distanceRef.current) distanceRef.current.textContent = left < 3 ? 'Reached' : `${Math.ceil(left / 5) * 5} m away`;
        if (autoCoordRef.current) autoCoordRef.current.textContent = formatCoord(position);
        pin.setEta(left < 3 ? '' : left / span > 0.45 ? `${stopWait} min` : 'Arriving');
        return left;
      };
      placeAuto(0);

      while (!cancelled) {
        for (const house of HOUSES) {
          if (cancelled) return;
          paintDots();
          pin.setLabel(String(house.number));
          pinOverlay.setPosition(house.position);
          nextHouse = house.position;
          stopWait = house.waitMinutes;
          if (houseCoordRef.current) houseCoordRef.current.textContent = formatCoord(house.position);
          legStart = autoDistance;
          legEnd = house.stopDistance;
          placeAuto(autoDistance);
          pin.show(true);
          publish({
            kind: 'driving',
            label: house.label,
            minutes: house.waitMinutes,
            clock: formatClock(house.arrivalMinutes - 1),
            distance: '',
            collected,
            houseNo: house.number,
            door: house.door,
            placeKind: house.placeKind,
          });
          await sleep(house.number === 1 ? 500 : 650);
          const from = autoDistance;
          const to = house.stopDistance;
          const duration = Math.min(Math.max(650 + (to - from) * 12, 1000), 3200);
          await animate(duration, (t) => placeAuto(from + (to - from) * easeInOutCubic(t)));
          if (cancelled) return;
          markCluster(house.placeIndex, 1);
          publish({
            kind: 'waiting',
            label: house.label,
            minutes: house.waitMinutes,
            clock: formatClock(house.arrivalMinutes),
            collected,
            houseNo: house.number,
            door: house.door,
            placeKind: house.placeKind,
          });
          await sleep(house.waitMinutes === 5 ? 5000 : 2400);
          collected += 1;
          markCluster(house.placeIndex, 2);
          publish({
            kind: 'collected',
            label: house.label,
            minutes: house.waitMinutes,
            clock: formatClock(house.arrivalMinutes + house.waitMinutes),
            collected,
            houseNo: house.number,
            door: house.door,
            placeKind: house.placeKind,
          });
          await sleep(900);
          pin.show(false);
          await sleep(450);
        }
        autoEl.style.opacity = '0';
        await sleep(500);
        collected = 0;
        placeStatus.fill(0);
        paintDots();
        nextHouse = first.position;
        placeAuto(0);
        await sleep(2200);
        autoEl.style.opacity = '1';
        await sleep(400);
      }
    }).catch(() => {});

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      cleanups.forEach((fn) => fn());
      trackMapRef.current = null;
      overviewMapRef.current = null;
      if (trackRef.current) trackRef.current.replaceChildren();
      if (overviewRef.current) overviewRef.current.replaceChildren();
    };
  }, []);

  useEffect(() => { trackMapRef.current?.setMapTypeId(kind); }, [kind]);
  useEffect(() => { overviewMapRef.current?.setMapTypeId(overviewKind); }, [overviewKind]);

  const headline = status.kind === 'driving'
    ? `Coming to ${status.label} (${status.houseNo} of ${HOUSES.length})`
    : status.kind === 'waiting'
      ? `Waiting ${status.minutes} min at ${status.label}`
      : `Collected at ${status.label}`;
  const step = status.kind === 'driving' ? 0 : status.kind === 'waiting' ? 1 : 2;

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '280px minmax(0, 1fr)' }, gap: 2, alignItems: 'start' }}>
      <style>{`@keyframes bswml-auto-pulse { from { transform: translate(-50%,-50%) scale(.5); opacity: .9; } to { transform: translate(-50%,-50%) scale(1.9); opacity: 0; } } @keyframes bswml-live-blink { 50% { opacity: .25; } }`}</style>
      <Box sx={{ bgcolor: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(16,24,32,.06)' }}>
        <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
          <Typography fontWeight={700}>Ward 39</Typography>
          <Typography variant="caption" color="text.secondary">Whole ward</Typography>
        </Box>
        <Box sx={{ position: 'relative', mx: 1, height: 220, borderRadius: '12px', overflow: 'hidden' }}>
          <Box ref={overviewRef} sx={{ position: 'absolute', inset: 0 }} />
          <TypeToggle value={overviewKind} onChange={setOverviewKind} />
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 2, py: 1.25 }}>
          Yellow is a house, orange is a shop, and purple is an apartment. The pin shows the demo number, and the auto collects 1, then 2, then 3.
        </Typography>
      </Box>

      <Box sx={{ bgcolor: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(16,24,32,.06)' }}>
        <Box sx={{ px: 2.5, pt: 1.5, pb: 1, display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'flex-start' }}>
          <Box>
            <Typography fontWeight={700}>Auto at this place</Typography>
            <Typography variant="caption" color="text.secondary">{headline}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 1, py: 0.4, borderRadius: '999px', bgcolor: '#F3F5F8', fontSize: 12, fontWeight: 700 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: COLORS.auto }} />
            {VEHICLE}
          </Box>
        </Box>
        <Box sx={{ position: 'relative', mx: 1, mb: 1, height: { xs: 440, md: 560 }, borderRadius: '12px', overflow: 'hidden', bgcolor: '#DDE2E8' }}>
          <Box ref={trackRef} sx={{ position: 'absolute', inset: 0 }} />
          <TypeToggle value={kind} onChange={setKind} />
          <Box sx={{ position: 'absolute', left: 12, top: 12, zIndex: 2, display: 'flex', alignItems: 'center', gap: 0.75, px: 1.1, py: 0.5, borderRadius: '999px', bgcolor: '#fff', fontSize: 11, fontWeight: 800, letterSpacing: '0.06em' }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: COLORS.house, animation: 'bswml-live-blink 1.2s ease-in-out infinite' }} />
            LIVE
          </Box>
          <Box sx={{ position: 'absolute', left: 12, top: 48, zIndex: 2, bgcolor: '#fff', borderRadius: '12px', px: 1.25, py: 1, boxShadow: '0 8px 24px rgba(16,24,32,.12)' }}>
            {[
              ['#F6B423', 'House', placesFile.counts.house],
              ['#FF6D00', 'Shop', placesFile.counts.shop],
              ['#7E57C2', 'Apartment', placesFile.counts.apartment],
            ].map(([color, label, count]) => (
              <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, fontSize: 12, fontWeight: 700, py: 0.25 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color }} />
                {label}
                <Box component="span" sx={{ color: 'text.secondary', fontWeight: 700 }}>{count.toLocaleString('en-IN')}</Box>
              </Box>
            ))}
          </Box>
          <Box sx={{ position: 'absolute', left: 12, right: { xs: 12, md: 'auto' }, bottom: 12, zIndex: 2, width: { md: 420 }, bgcolor: '#fff', borderRadius: '14px', px: 2, pt: 1.75, pb: 1.5, boxShadow: '0 8px 24px rgba(16,24,32,.16)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: '50%', bgcolor: 'rgba(31,168,106,.14)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
                  <path fill={COLORS.auto} d="M5 21.5V14c0-4.4 3.6-8 8-8h6.2l4.6 6.2h2.4c1.2 0 2.2 1 2.2 2.2v7.1Z" />
                  <circle fill="#14233A" cx="10" cy="23" r="3" />
                  <circle fill="#14233A" cx="23.5" cy="23" r="3" />
                </svg>
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="caption" fontWeight={700} sx={{ letterSpacing: '0.06em', textTransform: 'uppercase' }} color="text.secondary">
                  {status.kind === 'driving' ? 'On the way' : status.kind === 'waiting' ? `At the ${status.placeKind === 'shop' ? 'shop' : status.placeKind === 'apartment' ? 'apartment' : 'house'}` : 'Done'}
                </Typography>
                <Typography fontWeight={700} noWrap>{headline}</Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" color="text.secondary">
                  {status.kind === 'driving' ? 'Arrives' : status.kind === 'waiting' ? 'Arrived' : 'Left at'}
                </Typography>
                <Typography fontWeight={800}>{status.clock}</Typography>
              </Box>
            </Box>
            <Box sx={{ mt: 1.25, height: 6, borderRadius: '999px', bgcolor: '#EEF1F4', overflow: 'hidden' }}>
              <Box ref={barRef} sx={{ height: '100%', width: 0, bgcolor: COLORS.auto, borderRadius: 'inherit' }} />
            </Box>
            <Box sx={{ mt: 1.25, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0.75, flex: 1 }}>
                {['On the way', 'At the place', 'Collected'].map((label, index) => {
                  const state = index < step ? 'done' : index === step ? 'active' : 'todo';
                  return (
                    <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, fontSize: 11, fontWeight: 700, color: state === 'todo' ? 'text.secondary' : 'text.primary' }}>
                      <Box sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        flexShrink: 0,
                        bgcolor: state === 'todo' ? '#E6E9EE' : COLORS.auto,
                        boxShadow: state === 'active' ? '0 0 0 4px rgba(31,168,106,.25)' : 'none',
                      }}
                      />
                      {label}
                    </Box>
                  );
                })}
              </Box>
              <Typography ref={distanceRef} variant="caption" fontWeight={700} sx={{ color: '#1A3F8B', fontVariantNumeric: 'tabular-nums' }}>
                —
              </Typography>
            </Box>
            <Box sx={{ mt: 1.25, pt: 1, borderTop: '1px solid', borderColor: 'divider', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              <Box>
                <Typography variant="caption" fontWeight={700} sx={{ letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: 10 }} color="text.secondary">
                  Type
                </Typography>
                <Typography fontWeight={700} sx={{ fontSize: 12 }}>
                  {status.placeKind === 'shop' ? 'Shop' : status.placeKind === 'apartment' ? 'Apartment' : 'House'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" fontWeight={700} sx={{ letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: 10 }} color="text.secondary">
                  House number
                </Typography>
                <Typography fontWeight={700} sx={{ fontSize: 12 }}>
                  {status.houseNo}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" fontWeight={700} sx={{ letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: 10 }} color="text.secondary">
                  Place location
                </Typography>
                <Typography ref={houseCoordRef} fontWeight={700} sx={{ fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
                  {formatCoord(HOUSES[0].position)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" fontWeight={700} sx={{ letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: 10, display: 'flex', alignItems: 'center', gap: 0.6 }} color="text.secondary">
                  <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: COLORS.house, display: 'inline-block' }} />
                  Auto live
                </Typography>
                <Typography ref={autoCoordRef} fontWeight={700} sx={{ fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
                  {formatCoord(ROUTE.points[0])}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
