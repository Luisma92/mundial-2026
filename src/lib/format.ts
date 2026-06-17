import { format, formatDistanceToNowStrict, parseISO, isToday, isTomorrow, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatMatchDate(iso: string, timeZone = 'Europe/Madrid'): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const localDate = new Intl.DateTimeFormat('es-ES', {
    timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
  return localDate.charAt(0).toUpperCase() + localDate.slice(1);
}

export function formatMatchTime(iso: string, timeZone = 'Europe/Madrid'): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('es-ES', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export function formatRelativeDay(iso: string, timeZone = 'Europe/Madrid'): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const localDateStr = new Intl.DateTimeFormat('en-CA', { timeZone }).format(date);
  const today = new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());
  if (localDateStr === today) return 'Hoy';
  const tomorrow = new Date(Date.now() + 86400000);
  const tomorrowStr = new Intl.DateTimeFormat('en-CA', { timeZone }).format(tomorrow);
  if (localDateStr === tomorrowStr) return 'Mañana';
  return new Intl.DateTimeFormat('es-ES', {
    timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(date);
}

export function formatDateLong(iso: string): string {
  try {
    return format(parseISO(iso), "EEEE d 'de' MMMM", { locale: es });
  } catch {
    return iso;
  }
}

export function timeUntil(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const diff = date.getTime() - Date.now();
  if (diff < 0) {
    try {
      return `hace ${formatDistanceToNowStrict(date, { locale: es })}`;
    } catch {
      return '';
    }
  }
  try {
    return `en ${formatDistanceToNowStrict(date, { locale: es })}`;
  } catch {
    return '';
  }
}

export function isMatchToday(iso: string, timeZone = 'Europe/Madrid'): boolean {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());
  const matchDay = new Intl.DateTimeFormat('en-CA', { timeZone }).format(date);
  return today === matchDay;
}

export { isToday, isTomorrow, isYesterday };
