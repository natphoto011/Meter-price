/**
 * Safe utility functions to mask sensitive user information
 */

export function maskCustomerName(name: string | undefined | null): string {
  if (!name) return "";
  const trimmed = name.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length <= 1) {
    if (trimmed.length > 4) {
      return trimmed.slice(0, Math.ceil(trimmed.length / 2)) + "xxxxxxx";
    }
    return trimmed + " xxxxxxx";
  }

  // Common titles in Thai and English
  const prefixes = ["นาย", "นาง", "นางสาว", "ด.ช.", "ด.ญ.", "คุณ", "mr", "mrs", "ms", "dr", "prof"];
  const firstLower = parts[0].toLowerCase();

  if (prefixes.some(p => firstLower === p) && parts.length > 2) {
    // Prefix is separated by space, e.g. "นาย สมชาย ยินดี" -> "นาย สมชาย xxxxxxx"
    return `${parts[0]} ${parts[1]} xxxxxxx`;
  } else {
    // Standard "นายสมชาย ยินดี" or "John Doe" -> "นายสมชาย xxxxxxx" or "John xxxxxxx"
    return `${parts[0]} xxxxxxx`;
  }
}

export function maskLocation(loc: string | undefined | null): string {
  if (!loc) return "";
  const trimmed = loc.trim();
  if (trimmed.length <= 16) {
    return trimmed.slice(0, Math.max(4, Math.ceil(trimmed.length / 2))) + "... XXXXXX";
  }
  // Show the start of the address (e.g., house number/Moo) and the end (e.g., District/Province)
  const prefix = trimmed.slice(0, 12);
  const suffix = trimmed.slice(-15);
  return `${prefix}...XXXXXX...${suffix}`;
}

export function maskPhone(phone: string | undefined | null): string {
  if (!phone) return "";
  const trimmed = phone.trim();
  if (trimmed.length <= 5) {
    return trimmed + "XXXXX";
  }
  return trimmed.slice(0, 5) + "XXXXX";
}

