import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';

import { debugLog } from '../../debug';

const LETTERS_SHOWN = 5;

/** One row of the letter density list. */
interface LetterCount {
  letter: string;
  count: number;
  /** Share of all letters, e.g. "12.50". */
  percentage: string;
}

/**
 * CHILD of AppComponent: letter frequency bars with a "See more / See less" toggle.
 * Receives (@Input): text, read-only data from the parent.
 * Sends: nothing. Whether the full list is expanded (showAll) only matters
 * inside this component, so it stays here instead of in the parent.
 */
@Component({
  selector: 'app-letter-density',
  templateUrl: './letter-density.component.html',
  styleUrl: './letter-density.component.css',
  // OnPush: only re-check this component when one of its @Inputs gets a new value
  // or one of its own template events fires (it depends on nothing else).
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LetterDensityComponent implements OnInit, OnChanges {
  @Input({ required: true }) text = '';

  letterCounts: LetterCount[] = [];
  showAll = false;

  get visibleCounts(): LetterCount[] {
    return this.showAll ? this.letterCounts : this.letterCounts.slice(0, LETTERS_SHOWN);
  }

  get hasLetters(): boolean {
    return this.letterCounts.length > 0;
  }

  get canExpand(): boolean {
    return this.letterCounts.length > LETTERS_SHOWN;
  }

  /** Builds the first density list once the initial inputs are set. */
  ngOnInit(): void {
    debugLog('[LetterDensity] ngOnInit: initial density');
    this.updateDensity();
  }

  /** Rebuilds the list on later text changes (the first one is covered by ngOnInit). */
  ngOnChanges(changes: SimpleChanges): void {
    debugLog('[LetterDensity] ngOnChanges: ' + Object.keys(changes).join(', '));

    const textChange = changes['text'];
    if (textChange && !textChange.firstChange) {
      this.updateDensity();
    }
  }

  toggleShowAll(): void {
    this.showAll = !this.showAll;
  }

  /** Counts each letter A-Z (upper and lower case together), most frequent first. */
  private updateDensity(): void {
    const counts: Record<string, number> = {};
    let totalLetters = 0;

    for (const character of this.text.toUpperCase()) {
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
    this.letterCounts = result;

    // When the list is short again the button is hidden, so close the list too.
    // Otherwise it would come back already expanded, showing "See less".
    if (!this.canExpand) {
      this.showAll = false;
    }
  }
}
