import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';

import { HeaderComponent, Theme } from './components/header/header.component';
import { LetterDensityComponent } from './components/letter-density/letter-density.component';
import { SettingsComponent } from './components/settings/settings.component';
import { StatsCardsComponent } from './components/stats-cards/stats-cards.component';
import { TextInputComponent } from './components/text-input/text-input.component';
import { debugLog } from './debug';
import { countWords, formatReadingTime } from './text-stats';

const THEME_STORAGE_KEY = 'character-counter-theme';

/**
 * PARENT component: the single source of truth for the whole app.
 * Receives: nothing (it is the root).
 * Sends DOWN: text, excludeSpaces, limitEnabled, limit, theme, readingTime (@Input bindings).
 * Listens UP: textChange, excludeSpacesChange, limitEnabledChange, limitChange, themeToggle
 * (@Output events). Children never change this state; they emit, the handlers
 * below update it, and Angular pushes the new values back down.
 */
@Component({
  selector: 'app-root',
  imports: [
    HeaderComponent,
    TextInputComponent,
    SettingsComponent,
    StatsCardsComponent,
    LetterDensityComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit, OnDestroy {
  // ---------- Application state (only changed by the handlers below) ----------
  text = '';
  excludeSpaces = false;
  limitEnabled = false;
  limit: number | null = null;
  theme: Theme = 'dark';

  /** Derived from text, so it is computed rather than stored. */
  get readingTime(): string {
    return formatReadingTime(countWords(this.text));
  }

  /** Tells us whether the operating system is set to light mode. */
  private lightSchemeQuery = window.matchMedia('(prefers-color-scheme: light)');
  private changeDetector = inject(ChangeDetectorRef);

  ngOnInit(): void {
    debugLog('[App] ngOnInit: loading theme');

    // Use the saved theme if there is one, otherwise follow the OS setting.
    const savedTheme = this.readSavedTheme();
    if (savedTheme) {
      this.setTheme(savedTheme);
    } else {
      this.setTheme(this.lightSchemeQuery.matches ? 'light' : 'dark');
    }

    // Keep following OS theme changes until the user picks a theme themselves.
    this.lightSchemeQuery.addEventListener('change', this.onSystemThemeChange);
  }

  ngOnDestroy(): void {
    debugLog('[App] ngOnDestroy: removing prefers-color-scheme listener');
    this.lightSchemeQuery.removeEventListener('change', this.onSystemThemeChange);
  }

  // ---------- Event handlers (children -> parent) ----------

  onTextChange(text: string): void {
    this.text = text;
  }

  onExcludeSpacesChange(excludeSpaces: boolean): void {
    this.excludeSpaces = excludeSpaces;
  }

  onLimitEnabledChange(limitEnabled: boolean): void {
    this.limitEnabled = limitEnabled;
  }

  onLimitChange(limit: number | null): void {
    this.limit = limit;
  }

  onThemeToggle(): void {
    const nextTheme: Theme = this.theme === 'dark' ? 'light' : 'dark';
    this.setTheme(nextTheme);
    this.saveTheme(nextTheme);
  }

  // ---------- Theme helpers ----------

  /** Arrow function so the same function can be added and removed as a listener. */
  private onSystemThemeChange = (event: MediaQueryListEvent): void => {
    if (this.readSavedTheme() === null) {
      this.setTheme(event.matches ? 'light' : 'dark');
      // This listener is not a template event, so Angular does not know the state
      // changed. markForCheck() asks it to run change detection and update the header.
      this.changeDetector.markForCheck();
    }
  };

  private setTheme(theme: Theme): void {
    this.theme = theme;
    // Theme colours are CSS variables; this class on <html> swaps them (see styles.css).
    document.documentElement.classList.toggle('light-theme', theme === 'light');
  }

  private readSavedTheme(): Theme | null {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
      return null;
    } catch {
      return null; // Storage can be blocked (e.g. some private modes).
    }
  }

  private saveTheme(theme: Theme): void {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore: the theme still works for this visit.
    }
  }
}
