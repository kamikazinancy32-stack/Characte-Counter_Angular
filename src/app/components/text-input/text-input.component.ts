import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';

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
  // OnPush: only re-check this component when one of its @Inputs gets a new value
  // or one of its own template events fires (it depends on nothing else).
  changeDetection: ChangeDetectionStrategy.OnPush,
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

    // Only check when the limit is switched on and is a positive number.
    if (this.limitEnabled && this.limit !== null && this.limit > 0) {
      this.isOverLimit = countCharacters(this.text, this.excludeSpaces) > this.limit;
    } else {
      this.isOverLimit = false;
    }

    this.warningMessage = this.isOverLimit
      ? `Limit reached! Your text exceeds ${this.limit} characters.`
      : '';
  }

  onInput(event: Event): void {
    this.textChange.emit((event.target as HTMLTextAreaElement).value);
  }
}
