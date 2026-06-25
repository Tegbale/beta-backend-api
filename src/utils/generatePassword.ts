import { randomBytes } from 'crypto';

const UPPER = 'ABCDEFGHJKMNPQRSTUVWXYZ';
const LOWER = 'abcdefghjkmnpqrstuvwxyz';
const DIGITS = '23456789';
const SPECIAL = '!@#$%';
const ALL = UPPER + LOWER + DIGITS + SPECIAL;

export function generatePassword(length = 12): string {
  const bytes = randomBytes(length + 4);
  const chars = [
    UPPER[bytes[0] % UPPER.length],
    LOWER[bytes[1] % LOWER.length],
    DIGITS[bytes[2] % DIGITS.length],
    SPECIAL[bytes[3] % SPECIAL.length],
  ];
  for (let i = 4; i < length; i++) {
    chars.push(ALL[bytes[i] % ALL.length]);
  }
  // Fisher-Yates shuffle with crypto bytes
  const shuffle = randomBytes(length);
  for (let i = length - 1; i > 0; i--) {
    const j = shuffle[i] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}
