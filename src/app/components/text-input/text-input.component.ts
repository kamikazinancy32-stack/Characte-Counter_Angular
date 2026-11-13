import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

import { debugLog } from '../../debug';
import { countCharacters } from '../../text-stats';

/**
 * CHILD of AppComponent: the textarea and the "limit reached" warning.
 * Receives (@Input): text, limit, limitEnabled, excludeSpaces, all owned by the parent.
 * Sends (@Output): textChange, the new text on every keystroke; the parent stores it
 * and passes it back down through [text].
 */
@Component({
  selector: 'app-text-input',
  templateUrl: './text-input.component.html',
  styleUrl: './text-input.component.css',
})
export class TextInputComponent implements OnChanges {
  @Input({ required: true }) text = '';
  @Input() limit: number | null = null;
  @Input() limitEnabled = false;
  /** Needed so the limit is checked against the same count shown on the card (as in the reference). */
  @Input() excludeSpaces = false;

  @Output() textChange = new EventEmitter<string>();

  isOverLimit = false;
  warningMessage = '';

  /** Re-checks the limit whenever the text, the limit or the counting mode changes. */
  ngOnChanges(changes: SimpleChanges): void {
    debugLog('[TextInput] ngOnChanges: ' + Object.keys(changes).join(', '));

    this.isOverLimit = this.exceedsLimit();
    this.warningMessage = this.isOverLimit
      ? `Limit reached! Your text exceeds ${this.limit} characters.`
      : '';
  }

  onInput(event: Event): void {
    this.textChange.emit((event.target as HTMLTextAreaElement).value);
  }

  private exceedsLimit(): boolean {
    // No warning when the limit is off, empty, or not a positive number.
    if (!this.limitEnabled || this.limit === null || this.limit <= 0) {
      return false;
    }
    return countCharacters(this.text, this.excludeSpaces) > this.limit;
  }
}
