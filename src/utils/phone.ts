const E164_PATTERN = /^\+[1-9]\d{6,14}$/;

/**
 * Normalize local TR numbers to E.164 (+90…).
 * Already-international numbers are trimmed; optional leading + kept.
 */
export function normalizePhoneNumber(input: string): string {
  const trimmed = input.trim().replace(/[\s()-]/g, "");

  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("+")) {
    return trimmed;
  }

  const digits = trimmed.replace(/\D/g, "");

  if (digits.startsWith("90") && digits.length >= 12) {
    return `+${digits}`;
  }

  if (digits.startsWith("0") && digits.length === 11) {
    return `+90${digits.slice(1)}`;
  }

  if (digits.length === 10 && digits.startsWith("5")) {
    return `+90${digits}`;
  }

  return digits ? `+${digits}` : "";
}

export function isValidPhoneNumber(phoneNumber: string): boolean {
  return E164_PATTERN.test(phoneNumber);
}
