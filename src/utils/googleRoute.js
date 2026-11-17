import { haversineKm } from './routeTrack';

/** A driving line that follows streets, drawn on the Google map. */

function asLatLng(point) {
  if (Array.isArray(point)) return { lat: point[0], lng: point[1] };
  return { lat: point.lat, lng: point.lng };
}

/** Ward start, the citizen house, and ward end. The drive goes through all three. */
export function wardDrivePoints(routes, wardId, house) {
  const wardRoutes = (routes || []).filter((route) => route.wardId === wardId && route.path?.length > 1);
  const starts = wardRoutes.map((route) => route.path[0]);
  const ends = wardRoutes.map((route) => route.path[route.path.length - 1]);
  const originPoint = [...starts].sort((a, b) => b[0] - a[0] || a[1] - b[1])[0];
  const destinationPoint = ends.reduce((best, point) => (
    !best || haversineKm(originPoint, point) > haversineKm(originPoint, best) ? point : best
  ), null);
  if (!originPoint || !destinationPoint || !house) return null;
  return {
    origin: asLatLng(originPoint),
    via: { lat: house.lat, lng: house.lng },
    destination: asLatLng(destinationPoint),
  };
}

async function fetchStreetRoute(origin, destination, via) {
  const stops = [origin, ...(via ? [via] : []), destination];
  const coords = stops.map((point) => `${point.lng},${point.lat}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Street route failed');
  const data = await response.json();
  const route = data.routes?.[0];
  const path = (route?.geometry?.coordinates || []).map(([lng, lat]) => [lat, lng]);
  if (data.code !== 'Ok' || path.length < 2) throw new Error(data.code || 'No street route');
  const toHouse = via ? route.legs?.[0] : route;
  return {
    path,
    distanceKm: (toHouse?.distance ?? route.distance) / 1000,
    durationMin: Math.max(1, Math.round((toHouse?.duration ?? route.duration) / 60)),
    houseAt: via ? [via.lat, via.lng] : [destination.lat, destination.lng],
  };
}

/** Prefer Google driving directions. If that API is not enabled, follow the street network. */
export async function fetchRoadRoute(origin, destination, via) {
  try {
    return await fetchDrivingRoute(origin, destination, via);
  } catch {
    return fetchStreetRoute(origin, destination, via);
  }
}

export function fetchDrivingRoute(origin, destination, via) {
  return new Promise((resolve, reject) => {
    if (!window.google?.maps?.DirectionsService) {
      reject(new Error('Directions service is not available'));
      return;
    }
    const service = new window.google.maps.DirectionsService();
    service.route({
      origin,
      destination,
      waypoints: via ? [{ location: via, stopover: true }] : undefined,
      travelMode: window.google.maps.TravelMode.DRIVING,
      region: 'in',
    }, (result, status) => {
      if (status !== 'OK' || !result?.routes?.[0]?.legs?.[0]) {
        reject(new Error(status || 'No driving route'));
        return;
      }
      const legs = result.routes[0].legs;
      const path = [];
      legs.forEach((leg) => {
        leg.steps.forEach((step) => {
          step.path.forEach((point) => {
            path.push([point.lat(), point.lng()]);
          });
        });
      });
      if (path.length < 2) {
        reject(new Error('Route had no road points'));
        return;
      }
      const toHouse = via ? legs[0] : legs[0];
      resolve({
        path,
        distanceKm: toHouse.distance.value / 1000,
        durationMin: Math.max(1, Math.round(toHouse.duration.value / 60)),
        houseAt: via ? [via.lat, via.lng] : [destination.lat, destination.lng],
      });
    });
  });
}
