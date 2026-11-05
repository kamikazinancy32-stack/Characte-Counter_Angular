import {
  Component,
  ElementRef,
  EventEmitter,
  Injector,
  Input,
  Output,
  ViewChild,
  afterNextRender,
  inject,
} from '@angular/core';

/**
 * "Exclude Spaces", "Set Character Limit", the limit field and the reading time.
 * @Input excludeSpaces / limitEnabled / limit / readingTime: state from AppComponent.
 * @Output excludeSpacesChange / limitEnabledChange / limitChange: report what the user
 * did; the parent updates its state and the new values come back down as inputs.
 */
@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent {
  @Input() excludeSpaces = false;
  @Input() limitEnabled = false;
  @Input() limit: number | null = null;
  @Input({ required: true }) readingTime = '';

  @Output() excludeSpacesChange = new EventEmitter<boolean>();
  @Output() limitEnabledChange = new EventEmitter<boolean>();
  @Output() limitChange = new EventEmitter<number | null>();

  @ViewChild('limitInput') private limitInput?: ElementRef<HTMLInputElement>;
  private injector = inject(Injector);

  onExcludeSpacesChange(event: Event): void {
    this.excludeSpacesChange.emit((event.target as HTMLInputElement).checked);
  }

  onLimitEnabledChange(event: Event): void {
    const enabled = (event.target as HTMLInputElement).checked;
    this.limitEnabledChange.emit(enabled);

    if (enabled) {
      // The field only becomes enabled once the parent's new state has rendered,
      // so wait for that render before moving focus into it (as the reference does).
      afterNextRender(() => this.limitInput?.nativeElement.focus(), { injector: this.injector });
    }
  }

  onLimitInput(event: Event): void {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    this.limitChange.emit(Number.isNaN(value) ? null : value);
  }
}
