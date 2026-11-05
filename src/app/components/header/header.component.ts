import { Component, EventEmitter, Input, Output } from '@angular/core';

export type Theme = 'dark' | 'light';

/**
 * Logo plus theme toggle.
 * @Input theme: the current theme, owned by AppComponent.
 * @Output themeToggle: asks the parent to switch theme; this component never switches it itself.
 */
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  @Input({ required: true }) theme: Theme = 'dark';

  @Output() themeToggle = new EventEmitter<void>();

  get isLight(): boolean {
    return this.theme === 'light';
  }

  /** Same icons as the reference: sun in dark mode, moon in light mode. */
  get iconSrc(): string {
    return this.isLight ? 'images/night-mode.png' : 'images/icon-sun.svg';
  }

  onToggleClick(): void {
    this.themeToggle.emit();
  }
}
