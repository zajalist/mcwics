// ── Word Puzzle Utilities ─────────────────────────────────
// Generation and scrambling functions for word puzzles.

/**
 * Fisher-Yates shuffle for arrays.
 */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Scramble a word's letters (attempts to produce a different arrangement).
 */
export function scrambleWord(word) {
  const letters = word.split('');
  let attempts = 0;
  let scrambled;
  do {
    scrambled = shuffle(letters).join('');
    attempts++;
  } while (scrambled === word && attempts < 20);
  return scrambled;
}

/**
 * Scramble each word in a phrase independently.
 */
export function scramblePhrase(phrase) {
  return phrase.split(/\s+/).map(w => scrambleWord(w)).join(' ');
}

/**
 * Generate letter tiles from answer + some random extra letters.
 */
export function generateLetterTiles(answer, extraCount = 3) {
  const base = answer.toUpperCase().replace(/[^A-Z]/g, '').split('');
  const extras = [];
  for (let i = 0; i < extraCount; i++) {
    extras.push(String.fromCharCode(65 + Math.floor(Math.random() * 26)));
  }
  return shuffle([...base, ...extras]);
}

/**
 * Word puzzle modes available in the editor.
 */
export const WORD_MODES = [
  { id: 'anagram',    label: 'Anagram (Scrambled Letters)' },
  { id: 'word_scramble', label: 'Word Scramble (Per-Word)' },
  { id: 'letter_tiles',  label: 'Letter Tiles (Drag & Spell)' },
  { id: 'fill_blank',    label: 'Fill in the Blank' },
];

/**
 * Auto-generate scrambled text from the answer based on mode.
 */
export function generateWordPuzzle(answer, mode = 'anagram') {
  if (!answer) return { scrambledText: '', tiles: null };
  switch (mode) {
    case 'anagram':
      return { scrambledText: scrambleWord(answer.toUpperCase()), tiles: null };
    case 'word_scramble':
      return { scrambledText: scramblePhrase(answer.toUpperCase()), tiles: null };
    case 'letter_tiles':
      return { scrambledText: '', tiles: generateLetterTiles(answer, Math.max(2, Math.floor(answer.length * 0.3))) };
    case 'fill_blank':
      // Replace random letters with underscores (keep ~40%)
      const chars = answer.split('');
      const blanked = chars.map((ch, i) => {
        if (/\s/.test(ch)) return ch; // keep spaces
        return Math.random() < 0.4 ? ch : '_';
      }).join('');
      return { scrambledText: blanked, tiles: null };
    default:
      return { scrambledText: scrambleWord(answer), tiles: null };
  }
}
