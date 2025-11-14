import { differenceInDays, isAfter } from "date-fns";

export interface ExpirationStatus {
  status: "expired" | "expiring" | "valid";
  days: number;
  color: string;
}

/**
 * Calculate expiration status for a given expiration date
 * @param expirationDate - The expiration date (string or Date)
 * @param warningDays - Number of days before expiration to show warning (default: 30)
 * @returns ExpirationStatus object with status, days until expiry, and color class
 */
export function getExpirationStatus(
  expirationDate: string | Date,
  warningDays: number = 30
): ExpirationStatus {
  const expDate = new Date(expirationDate);
  const now = new Date();
  const daysUntilExpiry = differenceInDays(expDate, now);

  if (isAfter(now, expDate)) {
    return { status: "expired", days: 0, color: "text-destructive" };
  } else if (daysUntilExpiry <= warningDays) {
    return { status: "expiring", days: daysUntilExpiry, color: "text-warning" };
  } else {
    return { status: "valid", days: daysUntilExpiry, color: "text-muted-foreground" };
  }
}

