import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

import { debugLog } from '../../debug';
import { countCharacters, countSentences, countWords, formatCount } from '../../text-stats';

/**
 * CHILD of AppComponent: the three coloured cards (characters, words, sentences).
 * Receives (@Input): text, excludeSpaces, read-only data from the parent.
 * Sends: nothing. It only displays data, so it has no @Output.
 */
@Component({
  selector: 'app-stats-cards',
  templateUrl: './stats-cards.component.html',
  styleUrl: './stats-cards.component.css',
})
export class StatsCardsComponent implements OnChanges {
  @Input({ required: true }) text = '';
  @Input() excludeSpaces = false;

  characterCount = formatCount(0);
  wordCount = formatCount(0);
  sentenceCount = formatCount(0);

  /**
   * Recalculates only what depends on the inputs that changed:
   * - text changes affect all three counts;
   * - excludeSpaces only affects the character count.
   */
  ngOnChanges(changes: SimpleChanges): void {
    debugLog('[StatsCards] ngOnChanges: ' + Object.keys(changes).join(', '));

    if (changes['text'] || changes['excludeSpaces']) {
      this.characterCount = formatCount(countCharacters(this.text, this.excludeSpaces));
    }

    if (changes['text']) {
      this.wordCount = formatCount(countWords(this.text));
      this.sentenceCount = formatCount(countSentences(this.text));
    }
  }
}
