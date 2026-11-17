/** Straight-line distance in kilometres between two { lat, lng } points. */
export function haversineKm(a, b) {
  if (a?.lat == null || a?.lng == null || b?.lat == null || b?.lng == null) return null;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatDistance(km) {
  if (km == null || !Number.isFinite(km)) return null;
  if (km < 1) return `${Math.max(10, Math.round(km * 1000))} m`;
  return `${km.toFixed(1)} km`;
}

/** Minutes for the auto to cover this distance. Uses 18 km/h when speed is missing. */
export function arrivalMinutes(km, speedKmh) {
  if (km == null || !Number.isFinite(km)) return null;
  const speed = speedKmh > 0 ? speedKmh : 18;
  return Math.max(1, Math.round((km / speed) * 60));
}

export function formatArrival(minutes) {
  if (minutes == null || !Number.isFinite(minutes)) return null;
  return `${Math.max(1, Math.round(minutes))} min`;
}

/** Sample door on the citizen's block, used as the house pin for distance. */
export function citizenHousePoint(data, user, address) {
  if (!data || !user) return null;
  const houses = (data.households || []).filter((h) => h.blockId === user.blockId && h.lat != null && h.lng != null);
  const door = String(address?.houseNo || '').trim();
  const street = String(address?.street || '').trim().toLowerCase();
  const match = houses.find((h) => door && String(h.doorNo) === door)
    || houses.find((h) => street && String(h.street || '').toLowerCase() === street)
    || houses[0]
    || null;
  if (match) {
    return { lat: match.lat, lng: match.lng, street: match.street, doorNo: match.doorNo };
  }
  const ward = (data.wards || []).find((w) => w.id === user.wardId);
  if (!ward || ward.lat == null) return null;
  return { lat: ward.lat, lng: ward.lng };
}

/** Plain place name for where the auto is right now. */
export function autoPlaceLabel(data, vehicle) {
  if (!data || !vehicle) return '';
  const block = (data.blocks || []).find((b) => b.id === vehicle.blockId);
  const ward = (data.wards || []).find((w) => w.id === vehicle.wardId);
  const houses = (data.households || []).filter((h) => h.wardId === vehicle.wardId && h.lat != null);
  let nearest = null;
  let nearestKm = Infinity;
  houses.forEach((h) => {
    const km = haversineKm(vehicle, h);
    if (km != null && km < nearestKm) {
      nearestKm = km;
      nearest = h;
    }
  });
  const near = nearest ? `near door ${nearest.doorNo}, ${nearest.street}` : null;
  const blockLabel = block?.code ? `block ${block.code}` : null;
  const wardLabel = ward?.name || null;
  return [near, blockLabel, wardLabel].filter(Boolean).join(', ');
}
