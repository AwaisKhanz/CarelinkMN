export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function capitalizeWords(str: string): string {
  return str.split(' ').map(capitalizeFirst).join(' ');
}

export function truncate(str: string, length: number, suffix: string = '...'): string {
  if (str.length <= length) return str;
  return str.substring(0, length - suffix.length) + suffix;
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  const maskedLocal = localPart.charAt(0) + '*'.repeat(localPart.length - 2) + localPart.charAt(localPart.length - 1);
  return `${maskedLocal}@${domain}`;
}

export function maskPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ***-${cleaned.slice(6)}`;
  }
  return phone.replace(/\d(?=\d{4})/g, '*');
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

export function formatAddress(
  addressLine1: string,
  addressLine2?: string,
  city?: string,
  state?: string,
  zipCode?: string
): string {
  const parts = [addressLine1];
  if (addressLine2) parts.push(addressLine2);
  if (city) parts.push(city);
  if (state) parts.push(state);
  if (zipCode) parts.push(zipCode);
  return parts.join(', ');
}

export function extractZipCodeFromAddress(address: string): string | null {
  const zipMatch = address.match(/\b\d{5}(-\d{4})?\b/);
  return zipMatch ? zipMatch[0] : null;
}

export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '');
}

export function generateReferralNumber(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `REF-${timestamp}-${random}`.toUpperCase();
}

export function generateCaseNumber(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `CASE-${timestamp}-${random}`.toUpperCase();
}
