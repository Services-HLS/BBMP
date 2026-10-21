import { format, subDays, startOfDay, parseISO, isWithinInterval, addMinutes } from 'date-fns';

export function todayISO() {
  return format(new Date(), 'yyyy-MM-dd');
}

export function formatDate(date, pattern = 'dd MMM yyyy') {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, pattern);
}

export function formatDateTime(date) {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd MMM yyyy, HH:mm');
}

export function formatTime(date) {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'HH:mm');
}

export function daysAgoISO(n) {
  return format(subDays(new Date(), n), 'yyyy-MM-dd');
}

export function inDateRange(dateStr, range) {
  if (!dateStr || !range) return true;
  const d = startOfDay(typeof dateStr === 'string' ? parseISO(dateStr) : dateStr);
  return isWithinInterval(d, {
    start: startOfDay(range.start),
    end: startOfDay(range.end),
  });
}

export function getRangeForFilter(filter) {
  const end = new Date();
  let start;
  if (filter === 'weekly') start = subDays(end, 6);
  else if (filter === 'monthly') start = subDays(end, 29);
  else start = end;
  return { start: startOfDay(start), end: startOfDay(end), filter };
}

export function addMins(date, mins) {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return addMinutes(d, mins).toISOString();
}

export function nowISO() {
  return new Date().toISOString();
}
