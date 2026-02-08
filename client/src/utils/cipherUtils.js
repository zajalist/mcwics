// ── Cipher Utilities ──────────────────────────────────────
// Encoding/decoding functions for the LockStep scenario editor.

/**
 * Caesar cipher: shift each letter by `shift` positions.
 */
export function caesarEncode(text, shift = 3) {
  return text.replace(/[a-zA-Z]/g, (ch) => {
    const base = ch >= 'a' ? 97 : 65;
    return String.fromCharCode(((ch.charCodeAt(0) - base + shift) % 26) + base);
  });
}

export function caesarDecode(text, shift = 3) {
  return caesarEncode(text, 26 - (shift % 26));
}

/**
 * ROT13: special case of Caesar with shift=13 (self-inverse).
 */
export function rot13(text) {
  return caesarEncode(text, 13);
}

/**
 * Atbash cipher: A↔Z, B↔Y, etc.
 */
export function atbashEncode(text) {
  return text.replace(/[a-zA-Z]/g, (ch) => {
    const base = ch >= 'a' ? 97 : 65;
    return String.fromCharCode(base + (25 - (ch.charCodeAt(0) - base)));
  });
}

/**
 * Vigenere cipher.
 */
export function vigenereEncode(text, key = 'KEY') {
  const k = key.toUpperCase();
  let ki = 0;
  return text.replace(/[a-zA-Z]/g, (ch) => {
    const base = ch >= 'a' ? 97 : 65;
    const shift = k.charCodeAt(ki % k.length) - 65;
    ki++;
    return String.fromCharCode(((ch.charCodeAt(0) - base + shift) % 26) + base);
  });
}

export function vigenereDecode(text, key = 'KEY') {
  const k = key.toUpperCase();
  let ki = 0;
  return text.replace(/[a-zA-Z]/g, (ch) => {
    const base = ch >= 'a' ? 97 : 65;
    const shift = k.charCodeAt(ki % k.length) - 65;
    ki++;
    return String.fromCharCode(((ch.charCodeAt(0) - base - shift + 26) % 26) + base);
  });
}

/**
 * Binary encoding: each character -> 8-bit binary string.
 */
export function binaryEncode(text) {
  return text.split('').map(ch => ch.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
}

export function binaryDecode(binary) {
  return binary.trim().split(/\s+/).map(b => String.fromCharCode(parseInt(b, 2))).join('');
}

/**
 * ASCII numeric encoding: each character -> its ASCII code.
 */
export function asciiEncode(text) {
  return text.split('').map(ch => ch.charCodeAt(0)).join(' ');
}

export function asciiDecode(codes) {
  return codes.trim().split(/\s+/).map(c => String.fromCharCode(parseInt(c, 10))).join('');
}

/**
 * Emoji substitution cipher: maps A-Z to emoji.
 */
const EMOJI_MAP = '🍎🌊🌵🎲🌍🔥🌿🏠🧊🎭🔑🌙🎵🌊🍊🎨🔮🌈☀️🌳🔧🌋🌊💎🛸⚡'.split('');

export function emojiEncode(text) {
  return text.toUpperCase().replace(/[A-Z]/g, ch => EMOJI_MAP[ch.charCodeAt(0) - 65] || ch);
}

export function emojiDecode(encoded, plaintext) {
  // Emoji ciphers are validated by comparing to plaintext answer, so no algorithmic decode needed
  return plaintext;
}

/**
 * Reverse text.
 */
export function reverseText(text) {
  return text.split('').reverse().join('');
}

/**
 * Morse code encoding.
 */
const MORSE_MAP = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
  'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
  'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
  'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
  'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
  '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
  '8': '---..', '9': '----.',
};

export function morseEncode(text) {
  return text.toUpperCase().split('').map(ch => {
    if (ch === ' ') return '/';
    return MORSE_MAP[ch] || ch;
  }).join(' ');
}

/**
 * Available cipher methods for the editor UI.
 */
export const CIPHER_METHODS = [
  { id: 'caesar3',    label: 'Caesar (shift 3)',  encode: t => caesarEncode(t, 3),  hint: 'Each letter is shifted 3 positions forward in the alphabet.' },
  { id: 'caesar5',    label: 'Caesar (shift 5)',  encode: t => caesarEncode(t, 5),  hint: 'Each letter is shifted 5 positions forward in the alphabet.' },
  { id: 'rot13',      label: 'ROT13',             encode: rot13,                     hint: 'Each letter is shifted 13 positions (halfway through the alphabet).' },
  { id: 'atbash',     label: 'Atbash',            encode: atbashEncode,              hint: 'The alphabet is reversed: A->Z, B->Y, C->X.' },
  { id: 'vigenere',   label: 'Vigenere (KEY)',     encode: t => vigenereEncode(t, 'KEY'), hint: 'A polyalphabetic cipher using the keyword "KEY".' },
  { id: 'reverse',    label: 'Reverse',           encode: reverseText,               hint: 'The text is written backwards.' },
  { id: 'morse',      label: 'Morse Code',        encode: morseEncode,               hint: 'Letters encoded as dots and dashes.' },
];

export const BINARY_METHOD  = { id: 'binary',  label: 'Binary',  encode: binaryEncode, hint: 'Each character is encoded as an 8-bit binary number.' };
export const ASCII_METHOD   = { id: 'ascii',   label: 'ASCII Codes', encode: asciiEncode, hint: 'Each character is shown as its ASCII number.' };
export const EMOJI_METHOD   = { id: 'emoji',   label: 'Emoji Substitution', encode: emojiEncode, hint: 'Each letter is replaced by an emoji.' };
