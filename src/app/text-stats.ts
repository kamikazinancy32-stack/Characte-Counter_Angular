/**
 * Counting functions shared by more than one component, so they live in one place.
 * countCharacters: TextInput (limit check) and StatsCards.
 * countWords: StatsCards and AppComponent (reading time).
 */

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
