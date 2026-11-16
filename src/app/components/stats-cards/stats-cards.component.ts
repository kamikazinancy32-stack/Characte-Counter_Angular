import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';

import { debugLog } from '../../debug';
import { countCharacters, countWords } from '../../text-stats';

/**
 * CHILD of AppComponent: the three coloured cards (characters, words, sentences).
 * Receives (@Input): text, excludeSpaces, read-only data from the parent.
 * Sends: nothing. It only displays data, so it has no @Output.
 */
@Component({
  selector: 'app-stats-cards',
  templateUrl: './stats-cards.component.html',
  styleUrl: './stats-cards.component.css',
  // OnPush: only re-check this component when one of its @Inputs gets a new value
  // or one of its own template events fires (it depends on nothing else).
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsCardsComponent implements OnChanges {
  @Input({ required: true }) text = '';
  @Input() excludeSpaces = false;

  // Shown with two digits, like the design ("07").
  characterCount = '00';
  wordCount = '00';
  sentenceCount = '00';

  /**
   * Recalculates only what depends on the inputs that changed:
   * - text changes affect all three counts;
   * - excludeSpaces only affects the character count.
   */
  ngOnChanges(changes: SimpleChanges): void {
    debugLog('[StatsCards] ngOnChanges: ' + Object.keys(changes).join(', '));

    if (changes['text'] || changes['excludeSpaces']) {
      this.characterCount = this.formatCount(countCharacters(this.text, this.excludeSpaces));
    }

    if (changes['text']) {
      this.wordCount = this.formatCount(countWords(this.text));
      this.sentenceCount = this.formatCount(this.countSentences());
    }
  }

  /** Counts sentences by counting groups of ending punctuation (".", "!", "?", "…"). */
  private countSentences(): number {
    // [.!?…]+ matches one or more ending marks in a row, so "Wait..." counts once.
    const endings = this.text.match(/[.!?…]+/g);
    return endings ? endings.length : 0;
  }

  /** Pads a count to at least two digits ("7" -> "07"), as on the design's cards. */
  private formatCount(count: number): string {
    return String(count).padStart(2, '0');
  }
}
