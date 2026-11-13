/**
 * Set to true to log every lifecycle hook to the browser console.
 * Useful for showing change detection: type in the textarea and watch
 * which components receive ngOnChanges and which inputs changed.
 */
export const DEBUG = true;

/** Writes a message to the console, but only when DEBUG is true. */
export function debugLog(message: string): void {
  if (DEBUG) {
    console.log(message);
  }
}
