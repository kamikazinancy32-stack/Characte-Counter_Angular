import { Component, OnDestroy, OnInit } from '@angular/core';

import { HeaderComponent, Theme } from './components/header/header.component';
import { debugLog } from './debug';

const THEME_STORAGE_KEY = 'character-counter-theme';
const LIGHT_SCHEME_QUERY = '(prefers-color-scheme: light)';

/**
 * Parent component and single source of truth.
 *
 * Data flow: every piece of state lives here and flows DOWN to the children
 * through @Input() bindings. Children never change it; they emit @Output()
 * events and the handlers below update the state, which Angular then pushes
 * back down to the children.
 */
@Component({
  selector: 'app-root',
  imports: [HeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit, OnDestroy {
  theme: Theme = 'dark';

  private colorSchemeQuery?: MediaQueryList;

  ngOnInit(): void {
    debugLog('[App] ngOnInit: loading theme');

    // Use the saved theme if there is one, otherwise follow the OS setting.
    this.colorSchemeQuery = window.matchMedia(LIGHT_SCHEME_QUERY);
    this.setTheme(this.readSavedTheme() ?? this.systemTheme());

    // Keep following OS theme changes until the user picks a theme themselves.
    this.colorSchemeQuery.addEventListener('change', this.onSystemThemeChange);
  }

  ngOnDestroy(): void {
    debugLog('[App] ngOnDestroy: removing prefers-color-scheme listener');
    this.colorSchemeQuery?.removeEventListener('change', this.onSystemThemeChange);
  }

  // ---------- Event handlers (children -> parent) ----------

  onThemeToggle(): void {
    const nextTheme: Theme = this.theme === 'dark' ? 'light' : 'dark';
    this.setTheme(nextTheme);
    this.saveTheme(nextTheme);
  }

  // ---------- Theme helpers ----------

  /** Arrow function so the same reference can be added and removed as a listener. */
  private onSystemThemeChange = (event: MediaQueryListEvent): void => {
    if (this.readSavedTheme() === null) {
      this.setTheme(event.matches ? 'light' : 'dark');
    }
  };

  private setTheme(theme: Theme): void {
    this.theme = theme;
    // Theme colours are CSS variables; this class on <html> swaps them (see styles.css).
    document.documentElement.classList.toggle('light-theme', theme === 'light');
  }

  private systemTheme(): Theme {
    return this.colorSchemeQuery?.matches ? 'light' : 'dark';
  }

  private readSavedTheme(): Theme | null {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      return saved === 'light' || saved === 'dark' ? saved : null;
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
