import { STORAGE_KEY, SESSION_KEY, PREFS_KEY, CITIZEN_PROFILE_KEY, STORAGE_VERSION } from '../constants';

export function safeParse(raw, fallback = null) {
  try {
    if (raw == null || raw === '') return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function getStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return window.localStorage;
}

export function getSessionStorage() {
  if (typeof window === 'undefined' || !window.sessionStorage) return null;
  return window.sessionStorage;
}

export function loadAppData() {
  const store = getStorage();
  if (!store) return null;
  const parsed = safeParse(store.getItem(STORAGE_KEY), null);
  if (!parsed || parsed._version !== STORAGE_VERSION) return null;
  return parsed;
}

export function saveAppData(data) {
  const store = getStorage();
  if (!store) return false;
  try {
    const payload = { ...data, _version: STORAGE_VERSION, _updatedAt: new Date().toISOString() };
    store.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch (err) {
    console.error('Failed to save app data', err);
    return false;
  }
}

export function clearAppData() {
  const store = getStorage();
  if (!store) return;
  store.removeItem(STORAGE_KEY);
}

export function loadSession() {
  const store = getStorage();
  if (!store) return null;
  return safeParse(store.getItem(SESSION_KEY), null);
}

export function saveSession(session) {
  const store = getStorage();
  if (!store) return;
  if (!session) {
    store.removeItem(SESSION_KEY);
    return;
  }
  store.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  const store = getStorage();
  if (!store) return;
  store.removeItem(SESSION_KEY);
}

export function loadPrefs() {
  const store = getStorage();
  if (!store) {
    return { theme: 'light', language: 'en', notifications: true };
  }
  return safeParse(store.getItem(PREFS_KEY), {
    theme: 'light',
    language: 'en',
    notifications: true,
  });
}

export function savePrefs(prefs) {
  const store = getStorage();
  if (!store) return;
  store.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export function loadCitizenProfiles() {
  const store = getStorage();
  if (!store) return {};
  return safeParse(store.getItem(CITIZEN_PROFILE_KEY), {}) || {};
}

export function loadCitizenProfile(userId) {
  if (!userId) return null;
  const all = loadCitizenProfiles();
  return all[userId] || null;
}

export function saveCitizenProfile(userId, profile) {
  const store = getStorage();
  if (!store || !userId) return false;
  try {
    const all = loadCitizenProfiles();
    all[userId] = {
      ...all[userId],
      ...profile,
      updatedAt: new Date().toISOString(),
    };
    store.setItem(CITIZEN_PROFILE_KEY, JSON.stringify(all));
    return true;
  } catch (err) {
    console.error('Failed to save citizen profile', err);
    return false;
  }
}

export function setTempSession(key, value) {
  const store = getSessionStorage();
  if (!store) return;
  store.setItem(key, JSON.stringify(value));
}

export function getTempSession(key, fallback = null) {
  const store = getSessionStorage();
  if (!store) return fallback;
  return safeParse(store.getItem(key), fallback);
}
