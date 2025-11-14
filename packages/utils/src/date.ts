import { format, formatDistance, isAfter, isBefore, addDays, subDays, differenceInHours, differenceInMinutes } from 'date-fns';

export function formatDate(date: Date, formatStr: string = 'MMM dd, yyyy'): string {
  return format(date, formatStr);
}

export function formatDateTime(date: Date, formatStr: string = 'MMM dd, yyyy HH:mm'): string {
  return format(date, formatStr);
}

export function formatRelativeTime(date: Date): string {
  return formatDistance(date, new Date(), { addSuffix: true });
}

export function isExpired(date: Date): boolean {
  return isBefore(date, new Date());
}

export function isUpcoming(date: Date): boolean {
  return isAfter(date, new Date());
}

export function addDaysToDate(date: Date, days: number): Date {
  return addDays(date, days);
}

export function subtractDaysFromDate(date: Date, days: number): Date {
  return subDays(date, days);
}

export function getHoursDifference(date1: Date, date2: Date): number {
  return differenceInHours(date2, date1);
}

export function getMinutesDifference(date1: Date, date2: Date): number {
  return differenceInMinutes(date2, date1);
}

// Check if opening is fresh (within 48 hours)
export function isOpeningFresh(freshnessTimestamp: Date): boolean {
  const hoursDiff = getHoursDifference(freshnessTimestamp, new Date());
  return hoursDiff <= 48;
}

// Check if invitation is expired (after 48 hours)
export function isInvitationExpired(expiresAt: Date): boolean {
  return isExpired(expiresAt);
}

// Get time until expiration
export function getTimeUntilExpiration(expiresAt: Date): string {
  if (isExpired(expiresAt)) {
    return 'Expired';
  }
  return formatRelativeTime(expiresAt);
}

// Format business hours
export function formatBusinessHours(openTime: string, closeTime: string): string {
  return `${openTime} - ${closeTime}`;
}

// Check if current time is within business hours
export function isWithinBusinessHours(openTime: string, closeTime: string): boolean {
  const now = new Date();
  const currentTime = format(now, 'HH:mm');
  return currentTime >= openTime && currentTime <= closeTime;
}
