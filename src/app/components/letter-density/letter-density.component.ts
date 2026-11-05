import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';

import { changedInputs, debugLog } from '../../debug';
import { LetterCount, getLetterDensity } from '../../text-stats';

const LETTERS_SHOWN = 5;

/**
 * Letter frequency bars with a "See more / See less" toggle.
 * @Input text: read-only data from AppComponent. Whether the full list is
 * expanded is purely local UI state, so it stays inside this component.
 */
@Component({
  selector: 'app-letter-density',
  templateUrl: './letter-density.component.html',
  styleUrl: './letter-density.component.css',
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
    debugLog('[LetterDensity] ngOnChanges:', changedInputs(changes));

    const textChange = changes['text'];
    if (textChange && !textChange.firstChange) {
      this.updateDensity();
    }
  }

  toggleShowAll(): void {
    this.showAll = !this.showAll;
  }

  private updateDensity(): void {
    this.letterCounts = getLetterDensity(this.text);
  }
}
