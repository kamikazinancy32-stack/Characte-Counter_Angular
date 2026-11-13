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

## Component hierarchy

```text
AppComponent               (parent: owns all the state)
├── HeaderComponent        (child)
├── TextInputComponent     (child)
├── SettingsComponent      (child)
├── StatsCardsComponent    (child)
└── LetterDensityComponent (child)
```

The **parent** (`AppComponent`) owns the state. The **children** only display the data
they receive through `@Input()`, or report what the user did through `@Output()` events.

## Data flow: inputs and outputs

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

| Hook          | Component                | What it does | When it runs |
| ------------- | ------------------------ | ------------ | ------------ |
| `ngOnInit`    | `AppComponent`           | Loads the saved theme from `localStorage` (or follows the OS setting) and starts listening for OS theme changes. | Once, when the app starts. |
| `ngOnDestroy` | `AppComponent`           | Removes the OS theme listener so it does not leak. | Once, when the component is destroyed (for example when the app is torn down). |
| `ngOnChanges` | `TextInputComponent`     | Re-checks whether the text is over the limit and shows or hides the warning. | Before `ngOnInit`, then every time `text`, `limit`, `limitEnabled` or `excludeSpaces` gets a new value. |
| `ngOnChanges` | `StatsCardsComponent`    | Recounts only what is affected: `text` → all three counts, `excludeSpaces` → characters only. | Before `ngOnInit`, then every time `text` or `excludeSpaces` gets a new value. |
| `ngOnInit`    | `LetterDensityComponent` | Builds the first letter density list. | Once, after the first `ngOnChanges`. |
| `ngOnChanges` | `LetterDensityComponent` | Rebuilds the list when the text changes (skips the first change, which `ngOnInit` covers). | Every time `text` gets a new value. |

Every hook writes a line to the browser console while `DEBUG` is `true` in
[`src/app/debug.ts`](src/app/debug.ts). Set it to `false` to silence the logs.

## Change detection

**What starts it.** Change detection runs after something happens in the page, mostly
user events such as typing in the textarea or clicking a checkbox or button. This app is
"zoneless" (the Angular 21 default), so Angular starts it after events handled in a
template, like `(input)` and `(click)`. The one place that changes state outside a
template event, the OS theme listener in `AppComponent`, calls `markForCheck()` to ask
Angular to update the page.

**What it does.** Angular walks the component tree from the top, compares each binding
(`{{ ... }}`, `[value]`, `[text]`, ...) with its previous value, and updates only
the parts of the page that changed.

**When `ngOnChanges` runs.** Only when a parent passes a **new** value to an `@Input()`.
If the value is the same, the child's `ngOnChanges` does not run.

**OnPush.** The five child components use `ChangeDetectionStrategy.OnPush`. They only
depend on their `@Input()`s, so Angular can skip checking them unless one of their inputs
gets a new value or one of their own template events (like the See more button) fires.

**How to see it.**

1. Keep `DEBUG = true` in [`src/app/debug.ts`](src/app/debug.ts), run the app and open
   the browser DevTools **Console**.
2. Type one letter. Three components log, because all three receive `text`:

   ```text
   [TextInput] ngOnChanges: text
   [StatsCards] ngOnChanges: text
   [LetterDensity] ngOnChanges: text
   ```

3. Tick "Set Character Limit" and change only the limit number. Only TextInput logs,
   because it is the only component that receives `limit`:

   ```text
   [TextInput] ngOnChanges: limit
   ```

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
npm run build      # output in dist/character-counter/browser
```

Built with Angular 21 (standalone components, plain CSS, no SSR).
