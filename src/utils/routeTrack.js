/** Distance helpers for the citizen trip map (sample route, not live GPS). */

export function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function pathDistanceKm(path) {
  if (!path || path.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < path.length; i += 1) total += haversineKm(path[i - 1], path[i]);
  return total;
}

export function pointAt(path, t) {
  if (!path?.length) return null;
  if (path.length === 1 || t <= 0) return { point: path[0], seg: 0, frac: 0 };
  const lengths = [];
  let total = 0;
  for (let i = 1; i < path.length; i += 1) {
    const len = haversineKm(path[i - 1], path[i]);
    lengths.push(len);
    total += len;
  }
  if (!total || t >= 1) {
    return { point: path[path.length - 1], seg: path.length - 2, frac: 1 };
  }
  let target = t * total;
  for (let i = 0; i < lengths.length; i += 1) {
    if (target <= lengths[i] || i === lengths.length - 1) {
      const frac = lengths[i] === 0 ? 0 : Math.min(1, target / lengths[i]);
      const a = path[i];
      const b = path[i + 1];
      return {
        point: [a[0] + (b[0] - a[0]) * frac, a[1] + (b[1] - a[1]) * frac],
        seg: i,
        frac,
      };
    }
    target -= lengths[i];
  }
  return { point: path[path.length - 1], seg: path.length - 2, frac: 1 };
}

export function sliceTo(path, seg, frac) {
  const a = path[seg];
  const b = path[seg + 1] || a;
  const end = [a[0] + (b[0] - a[0]) * frac, a[1] + (b[1] - a[1]) * frac];
  if (frac <= 0) return path.slice(0, seg + 1);
  return [...path.slice(0, seg + 1), end];
}

export function sliceFrom(path, seg, frac) {
  const a = path[seg];
  const b = path[seg + 1] || a;
  const start = [a[0] + (b[0] - a[0]) * frac, a[1] + (b[1] - a[1]) * frac];
  return [start, ...path.slice(seg + 1)];
}

export function fractionAtIndex(path, index) {
  const total = pathDistanceKm(path);
  if (!total) return 0;
  const cut = Math.max(0, Math.min(index, path.length - 1));
  return pathDistanceKm(path.slice(0, cut + 1)) / total;
}

/** Insert a stop on the nearest part of the route. */
export function insertOnPath(path, point) {
  if (!path?.length) return { path: [point], index: 0 };
  if (path.length === 1) return { path: [path[0], point], index: 1 };
  let bestKm = Infinity;
  let bestI = 0;
  for (let i = 0; i < path.length - 1; i += 1) {
    const a = path[i];
    const b = path[i + 1];
    const dx = b[1] - a[1];
    const dy = b[0] - a[0];
    const len2 = dx * dx + dy * dy;
    let t = 0;
    if (len2 > 0) {
      t = ((point[1] - a[1]) * dx + (point[0] - a[0]) * dy) / len2;
      t = Math.max(0, Math.min(1, t));
    }
    const proj = [a[0] + dy * t, a[1] + dx * t];
    const km = haversineKm(point, proj);
    if (km < bestKm) {
      bestKm = km;
      bestI = i;
    }
  }
  const next = [...path.slice(0, bestI + 1), point, ...path.slice(bestI + 1)];
  return { path: next, index: bestI + 1 };
}

/**
 * If the route start sits on the house or the end pin, move it back
 * along the road so the Start label has its own place.
 */
export function shiftStartClear(path, houseIndex, minKm = 0.9) {
  if (!path || path.length < 2) return { path: path || [], houseIndex };
  const blocked = [path[houseIndex], path[path.length - 1]].filter(Boolean);
  const toward = path[1];
  let start = path[0];
  let moved = false;
  for (let step = 0; step < 8; step += 1) {
    const nearest = blocked.reduce((min, point) => Math.min(min, haversineKm(start, point)), Infinity);
    if (nearest >= minKm) break;
    const leg = haversineKm(start, toward);
    if (leg < 0.02) {
      start = [start[0] + 0.008, start[1] - 0.008];
    } else {
      const scale = Math.max(minKm - nearest, 0.35) / leg;
      start = [
        start[0] + (start[0] - toward[0]) * scale,
        start[1] + (start[1] - toward[1]) * scale,
      ];
    }
    moved = true;
  }
  if (!moved) return { path, houseIndex };
  return { path: [start, ...path], houseIndex: houseIndex + 1 };
}

export function nearestPathIndex(path, point) {
  if (!path?.length || !point) return 0;
  const target = Array.isArray(point) ? point : [point.lat, point.lng];
  let best = 0;
  let bestKm = Infinity;
  path.forEach((stop, index) => {
    const km = haversineKm(stop, target);
    if (km < bestKm) {
      bestKm = km;
      best = index;
    }
  });
  return best;
}

export function kmBetweenFractions(path, fromT, toT) {
  return Math.abs(toT - fromT) * pathDistanceKm(path);
}

export function formatDistance(km) {
  if (km == null || Number.isNaN(km)) return '—';
  if (km < 0.05) return 'Here';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function etaMinutes(km, speedKmh) {
  if (km == null || km < 0.05) return 0;
  const speed = speedKmh > 0 ? speedKmh : 18;
  return Math.max(1, Math.round((km / speed) * 60));
}
