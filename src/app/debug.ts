/**
 * Set to true to log every lifecycle hook to the browser console.
 * Useful for showing change detection: type in the textarea and watch
 * which components receive ngOnChanges and which inputs changed.
 */
export const DEBUG = true;

export function debugLog(...messages: unknown[]): void {
  if (DEBUG) {
    console.log(...messages);
  }
}

/** Lists which @Input()s changed in a SimpleChanges object, e.g. "text, excludeSpaces". */
export function changedInputs(changes: object): string {
  return Object.keys(changes).join(', ');
}
