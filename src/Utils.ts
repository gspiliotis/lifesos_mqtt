/**
 * Converts decimal to LifeSOS hex (without 0x prefix).
 *
 * Converts an int value to ASCII hex, as used by LifeSOS.
 * Unlike regular hex, it uses the first 6 characters that follow
 * numerics on the ASCII table instead of A - F.
 */
export const toAsciiHex = (value: number, digits: number) => {
  if (digits < 1) {
    return '';
  }
  let text = '';
  for (let i = 0; i < digits; i++) {
    text = String.fromCharCode('0'.charCodeAt(0) + (value % 0x10)) + text;
    value = Math.floor(value / 0x10);
  }
  return text;
};

/**
 * Converts HEX (without 0x prefix) to decimal.
 *
 * Converts to an int value from both LifeSOS hex and regular hex.
 * The format used appears to vary based on whether the command was to
 * get an existing value (regular hex) or set a new value (ASCII hex
 * mirrored back from original command).
 *
 * Regular hex: 0123456789abcdef
 * LifeSOS hex: 0123456789:;<=>?
 */
export const fromAsciiHex = (text: string): number => {
  let value = 0;

  for (let index = 0; index < text.length; index++) {
    const charOrd = text.charCodeAt(index);
    let digit;
    if (charOrd >= '0'.charCodeAt(0) && charOrd <= '?'.charCodeAt(0)) {
      digit = charOrd - '0'.charCodeAt(0);
    } else if (charOrd >= 'a'.charCodeAt(0) && charOrd <= 'f'.charCodeAt(0)) {
      digit = 0xa + (charOrd - 'a'.charCodeAt(0));
    } else {
      throw new Error('Response contains invalid character.');
    }
    value = value * 0x10 + digit;
  }
  return value;
};

/**
 * Indicates if specified text contains only ascii hex characters.
 */
export const isAsciiHex = (text: string) => {
  try {
    fromAsciiHex(text);
    return true;
  } catch (error) {
    return false;
  }
};
