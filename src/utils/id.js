let counter = 0;

export function uid(prefix = 'id') {
  counter += 1;
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${ts}${counter.toString(36)}${rnd}`;
}

export function complaintId() {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `CMP-${n}`;
}

export function eventId() {
  const n = Math.floor(10000 + Math.random() * 90000);
  return `AIE-${n}`;
}

export function scoreId(vehicleId, date) {
  return `score-${vehicleId}-${date}`;
}
