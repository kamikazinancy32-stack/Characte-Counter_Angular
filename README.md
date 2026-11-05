# Character Counter (Angular)

AmaliTech lab: **Component Interaction & Lifecycle**. A real-time text analyser built
with Angular standalone components, using `@Input()` / `@Output()` for all
parent–child communication and lifecycle hooks for every calculation.

## Features

- Live character, word and sentence counts (two-digit cards, e.g. `07`)
- **Exclude Spaces** option, with "(no space)" shown on the character card
- **Set Character Limit**: when the text goes over the limit, the textarea border turns orange and
  _"Limit reached! Your text exceeds X characters."_ appears
- Approximate reading time at 200 words per minute (`<1 minute`, `1 minute`, `X minutes`)
- Letter density: frequency and percentage of each letter A–Z, sorted, top 5 with
  **See more / See less**, and an empty-state message when there is no text
- Light and dark themes: the first visit follows the OS setting (`prefers-color-scheme`);
  a manual choice is saved in `localStorage`
- Responsive layout (mobile < 768px, tablet, desktop up to 990px wide)
- Accessible: keyboard navigable, visible `:focus-visible` outlines, labelled controls,
  `aria-live="polite"` on the warning, stats and reading time, `aria-pressed` on the theme
  toggle, `aria-expanded` on See more

## Component tree and data flow

`AppComponent` is the only place where state lives (`text`, `excludeSpaces`,
`limitEnabled`, `limit`, `theme`). Data flows **down** through `@Input()` bindings;
user actions flow **up** as `@Output()` `EventEmitter` events. Children never change
the parent's state. They emit, the parent's handler updates its state, and Angular
pushes the new values back down.

```text
AppComponent  (state: text, excludeSpaces, limitEnabled, limit, theme; derived: readingTime)
│
├── HeaderComponent
│     @Input   theme           ◄── theme
│     @Output  themeToggle     ──► onThemeToggle()
│
├── TextInputComponent
│     @Input   text            ◄── text
│     @Input   limit           ◄── limit
│     @Input   limitEnabled    ◄── limitEnabled
│     @Input   excludeSpaces   ◄── excludeSpaces   (limit is checked against the displayed count)
│     @Output  textChange      ──► onTextChange($event)
│
├── SettingsComponent
│     @Input   excludeSpaces   ◄── excludeSpaces
│     @Input   limitEnabled    ◄── limitEnabled
│     @Input   limit           ◄── limit
│     @Input   readingTime     ◄── readingTime
│     @Output  excludeSpacesChange ──► onExcludeSpacesChange($event)
│     @Output  limitEnabledChange  ──► onLimitEnabledChange($event)
│     @Output  limitChange         ──► onLimitChange($event)
│
├── StatsCardsComponent
│     @Input   text            ◄── text
│     @Input   excludeSpaces   ◄── excludeSpaces
│
└── LetterDensityComponent
      @Input   text            ◄── text
```

Example round trip: you type in the textarea → `TextInputComponent` emits `textChange`
→ `AppComponent.onTextChange()` sets `text` → Angular sends the new `text` to
TextInput, StatsCards and LetterDensity, and the new `readingTime` to Settings.

## Lifecycle hooks

| Component                | Hook          | Why it is used |
| ------------------------ | ------------- | -------------- |
| `AppComponent`           | `ngOnInit`    | Loads the saved theme from `localStorage`, or falls back to `prefers-color-scheme`, and starts listening for OS theme changes. |
| `AppComponent`           | `ngOnDestroy` | Removes the `matchMedia` `change` listener so it cannot leak. |
| `TextInputComponent`     | `ngOnChanges` | Re-checks whether the text exceeds the limit whenever `text`, `limit`, `limitEnabled` or `excludeSpaces` changes, and shows or hides the warning. |
| `StatsCardsComponent`    | `ngOnChanges` | Uses `SimpleChanges` to recount only what is affected: `text` → characters, words, sentences; `excludeSpaces` → characters only. |
| `LetterDensityComponent` | `ngOnInit`    | Builds the first density list once the initial input is set. |
| `LetterDensityComponent` | `ngOnChanges` | Rebuilds the list on later `text` changes (skips `firstChange`, which `ngOnInit` covers). |

### Seeing change detection in the console

Every hook logs to the browser console while `DEBUG` is `true` in
[`src/app/debug.ts`](src/app/debug.ts). For example, changing only the limit logs

```text
[TextInput] ngOnChanges: limit
```

and no other component, because no other component receives `limit`. Set `DEBUG = false`
to silence the logs.

## Project structure

```text
src/
├── index.html                 DM Sans font, page title
├── styles.css                 design tokens, light/dark theme variables, base rules
└── app/
    ├── app.component.*        parent: state, event handlers, theme hooks
    ├── text-stats.ts          pure counting functions (characters, words, sentences, reading time, density)
    ├── debug.ts               DEBUG flag and lifecycle logger
    └── components/
        ├── header/
        ├── text-input/
        ├── settings/
        ├── stats-cards/
        └── letter-density/
public/images/                 logo, theme icons, card patterns, dark background
```

The theme colours are CSS custom properties on `:root`. `AppComponent` toggles the
`light-theme` class on `<html>` to switch the whole palette.

## Running it

Requirements: Node.js 20.19+, 22.12+ or 24+, and npm.

```bash
npm install
npm start          # same as: ng serve
```

Open http://localhost:4200/. To make a production build:

```bash
npm run build      # output in dist/character-counter
```

Built with Angular 21 (standalone components, plain CSS, no SSR).
