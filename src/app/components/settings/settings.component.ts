import {
  Component,
  EventEmitter,
  Injector,
  Input,
  Output,
  afterNextRender,
  inject,
} from '@angular/core';

/**
 * CHILD of AppComponent: "Exclude Spaces", "Set Character Limit", the limit field and the reading time.
 * Receives (@Input): excludeSpaces, limitEnabled, limit, readingTime from the parent.
 * Sends (@Output): excludeSpacesChange, limitEnabledChange, limitChange to report what the
 * user did; the parent updates its state and the new values come back down as inputs.
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

  // afterNextRender (used below) needs an injector when it is called from an event handler.
  private injector = inject(Injector);

  onExcludeSpacesChange(event: Event): void {
    this.excludeSpacesChange.emit((event.target as HTMLInputElement).checked);
  }

  /** limitInput is the number field, passed in from the template (#limitInput). */
  onLimitEnabledChange(event: Event, limitInput: HTMLInputElement): void {
    const enabled = (event.target as HTMLInputElement).checked;
    this.limitEnabledChange.emit(enabled);

    if (enabled) {
      // The field is still disabled until Angular re-renders with the parent's new state,
      // so wait for that render, then move the keyboard focus into the field.
      afterNextRender(() => limitInput.focus(), { injector: this.injector });
    }
  }

  onLimitInput(event: Event): void {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    this.limitChange.emit(Number.isNaN(value) ? null : value);
  }
}
