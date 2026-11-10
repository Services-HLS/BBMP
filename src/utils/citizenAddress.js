import { loadCitizenProfile } from './storage';

export const EMPTY_HOUSE_ADDRESS = {
  houseNo: '',
  street: '',
  area: '',
  landmark: '',
  city: 'Bengaluru',
  pincode: '',
};

export function hasHouseAddress(addr) {
  return Boolean(addr?.houseNo || addr?.street || addr?.area || addr?.pincode);
}

export function formatHouseAddress(addr, { singleLine = false } = {}) {
  if (!addr || !hasHouseAddress(addr)) return '';
  const parts = [
    [addr.houseNo, addr.street].filter(Boolean).join(', '),
    addr.area,
    addr.landmark ? `Near ${addr.landmark}` : '',
    [addr.city, addr.pincode].filter(Boolean).join(' — '),
  ].filter(Boolean);
  return parts.join(singleLine ? ', ' : '\n');
}

/** Resolve saved house address, or demo default from user, or empty. */
export function getCitizenHouseAddress(user) {
  if (!user?.id) return { ...EMPTY_HOUSE_ADDRESS };
  const saved = loadCitizenProfile(user.id);
  if (saved?.address && hasHouseAddress(saved.address)) {
    return { ...EMPTY_HOUSE_ADDRESS, ...saved.address };
  }
  if (user.defaultAddress) {
    return { ...EMPTY_HOUSE_ADDRESS, ...user.defaultAddress };
  }
  return { ...EMPTY_HOUSE_ADDRESS };
}
