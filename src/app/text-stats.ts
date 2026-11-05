/**
 * Pure counting helpers shared by the components.
 * The logic matches Reference/javascript.js: no side effects, same input -> same output.
 */

export const WORDS_PER_MINUTE = 200;

export interface LetterCount {
  letter: string;
  count: number;
  /** Share of all alphabetic characters, e.g. "12.50". */
  percentage: string;
}

/** Pads a count to at least two digits ("7" -> "07"), as on the reference cards. */
export function formatCount(count: number): string {
  return String(count).padStart(2, '0');
}

/** Counts every character, or only non-whitespace ones when spaces are excluded. */
export function countCharacters(text: string, excludeSpaces: boolean): number {
  return excludeSpaces ? text.replace(/\s/g, '').length : text.length;
}

/** Counts runs of non-whitespace characters. */
export function countWords(text: string): number {
  return text.split(/\s+/).filter((word) => word !== '').length;
}

/** Counts groups of sentence-ending punctuation (".", "!", "?", "…"). */
export function countSentences(text: string): number {
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
  return minutes === 1 ? '1 minute' : `${minutes} minutes`;
}

/** Counts each letter A-Z (case-insensitive), sorted from most to least frequent. */
export function getLetterDensity(text: string): LetterCount[] {
  const letters = [...text.toUpperCase()].filter((character) => /[A-Z]/.test(character));
  const counts: Record<string, number> = {};

  letters.forEach((letter) => {
    counts[letter] = (counts[letter] || 0) + 1;
  });

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([letter, count]) => ({
      letter,
      count,
      percentage: ((count / letters.length) * 100).toFixed(2),
    }));
}
