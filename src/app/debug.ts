import { isDevMode } from '@angular/core';

/**
 * Logs every lifecycle hook to the browser console while developing (ng serve).
 * Useful for showing change detection: type in the textarea and watch
 * which components receive ngOnChanges and which inputs changed.
 * isDevMode() is false in a production build (ng build), so the logs are not shipped.
 */
export const DEBUG = isDevMode();

/** Writes a message to the console, but only when DEBUG is true. */
export function debugLog(message: string): void {
  if (DEBUG) {
    console.log(message);
  }
}
