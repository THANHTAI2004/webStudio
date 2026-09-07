export function normalizeBookingPhone(phone: string): string | null {
  const collapsedPhone = phone.trim().replace(/[\s().-]/g, '');

  if (!/^\+?\d+$/.test(collapsedPhone)) {
    return null;
  }

  const digits = collapsedPhone.startsWith('+')
    ? collapsedPhone.slice(1)
    : collapsedPhone;

  if (digits.length < 8 || digits.length > 15) {
    return null;
  }

  return collapsedPhone.startsWith('+') ? `+${digits}` : digits;
}
