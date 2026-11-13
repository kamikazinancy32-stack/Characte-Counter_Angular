/**
 * Plain counting functions used by the components.
 * They only read their arguments and return a result (no side effects).
 */

const WORDS_PER_MINUTE = 200;

/** One row of the letter density list. */
export interface LetterCount {
  letter: string;
  count: number;
  /** Share of all letters, e.g. "12.50". */
  percentage: string;
}

/** Pads a count to at least two digits ("7" -> "07"), as on the design's cards. */
export function formatCount(count: number): string {
  return String(count).padStart(2, '0');
}

/** Counts every character, or only non-space characters when spaces are excluded. */
export function countCharacters(text: string, excludeSpaces: boolean): number {
  if (excludeSpaces) {
    // \s means "any whitespace" (space, tab, new line); g means "replace all of them".
    return text.replace(/\s/g, '').length;
  }
  return text.length;
}

/** Counts words: pieces of text separated by whitespace. */
export function countWords(text: string): number {
  // Split on one or more whitespace characters, then drop the empty pieces
  // that appear when the text starts or ends with a space.
  const pieces = text.split(/\s+/);
  return pieces.filter((word) => word !== '').length;
}

/** Counts sentences by counting groups of ending punctuation (".", "!", "?", "…"). */
export function countSentences(text: string): number {
  // [.!?…]+ matches one or more ending marks in a row, so "Wait..." counts once.
  const endings = text.match(/[.!?…]+/g);
  return endings ? endings.length : 0;
}

/** Approximate reading time at 200 words per minute. */
export function formatReadingTime(words: number): string {
  if (words === 0) {
    return '0 minute';
  }

  const minutes = Math.round(words / WORDS_PER_MINUTE);

  if (minutes < 1) {
    return '<1 minute';
  }
  if (minutes === 1) {
    return '1 minute';
  }
  return `${minutes} minutes`;
}

/** Counts each letter A-Z (upper and lower case together), most frequent first. */
export function getLetterDensity(text: string): LetterCount[] {
  const counts: Record<string, number> = {};
  let totalLetters = 0;

  for (const character of text.toUpperCase()) {
    // Skip anything that is not a letter A-Z (spaces, digits, punctuation...).
    if (/[A-Z]/.test(character)) {
      counts[character] = (counts[character] || 0) + 1;
      totalLetters++;
    }
  }

  const result: LetterCount[] = [];
  for (const letter in counts) {
    const percentage = (counts[letter] / totalLetters) * 100;
    result.push({ letter, count: counts[letter], percentage: percentage.toFixed(2) });
  }

  // Sort from the highest count to the lowest.
  result.sort((a, b) => b.count - a.count);
  return result;
}
