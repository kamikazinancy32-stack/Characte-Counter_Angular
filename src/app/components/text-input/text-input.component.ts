import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

import { changedInputs, debugLog } from '../../debug';
import { countCharacters } from '../../text-stats';

/**
 * The textarea and the "limit reached" warning.
 * @Input text / limit / limitEnabled / excludeSpaces: state owned by AppComponent.
 * @Output textChange: emits the new text on every keystroke; the parent stores it
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
    debugLog('[TextInput] ngOnChanges:', changedInputs(changes));

    this.isOverLimit = this.exceedsLimit();
    this.warningMessage = this.isOverLimit
      ? `Limit reached! Your text exceeds ${this.limit} characters.`
      : '';
  }

  onInput(event: Event): void {
    this.textChange.emit((event.target as HTMLTextAreaElement).value);
  }

  private exceedsLimit(): boolean {
    const limit = this.limit ?? 0;
    return (
      this.limitEnabled && limit > 0 && countCharacters(this.text, this.excludeSpaces) > limit
    );
  }
}
