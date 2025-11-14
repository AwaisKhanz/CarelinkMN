export function computeHoursUntilExpiry(freshnessTimestamp: Date, freshnessHours: number = 48): number {
  const now = Date.now();
  const expiry = new Date(freshnessTimestamp).getTime() + freshnessHours * 60 * 60 * 1000;
  const diffMs = expiry - now;
  return Math.floor(diffMs / (1000 * 60 * 60));
}

export function isExpiringSoon(freshnessTimestamp: Date, thresholdHours: number = 12): boolean {
  const hours = computeHoursUntilExpiry(freshnessTimestamp);
  return hours >= 0 && hours <= thresholdHours;
}

export function isExpired(freshnessTimestamp: Date, freshnessHours: number = 48): boolean {
  return computeHoursUntilExpiry(freshnessTimestamp, freshnessHours) < 0;
}


