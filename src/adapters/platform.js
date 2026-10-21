/**
 * Platform adapters — browser now, Capacitor plugins later.
 * Keep native permission prompts behind explicit user actions.
 */

export function isNativePlatform() {
  try {
    return Boolean(window.Capacitor?.isNativePlatform?.());
  } catch {
    return false;
  }
}

export async function readLocalFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Placeholder for future Capacitor Camera plugin */
export async function capturePhoto() {
  if (!isNativePlatform()) {
    throw new Error('Camera capture is available in native builds via Capacitor Camera plugin');
  }
  // Future: import('@capacitor/camera')
  throw new Error('Capacitor Camera not configured in this prototype');
}

/** Placeholder for future Capacitor Geolocation */
export async function getCurrentPosition() {
  if (!navigator.geolocation) {
    throw new Error('Geolocation unavailable');
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      reject,
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}
