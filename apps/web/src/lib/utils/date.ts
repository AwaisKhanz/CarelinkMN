/**
 * Normalizes a date value to an ISO string for API requests
 */
export function normalizeDate(
  date: Date | string | null | undefined
): string | null {
  if (date === null || date === undefined) {
    return null;
  }
  
  if (typeof date === "string") {
    return date;
  }
  
  return date.toISOString();
}

