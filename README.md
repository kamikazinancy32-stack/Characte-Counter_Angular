# Character Counter (Angular)

A text analyser that updates while you type. It shows character, word and sentence counts,
lets you set a character limit, estimates reading time, shows how often each letter is
used, and has a light and a dark theme.

I built it for the **FEM10: Components** module (lab: _Component Interaction & Lifecycle_).
It started as a vanilla JavaScript project and I rebuilt it in Angular, splitting the page
into components that only talk to each other through `@Input()` and `@Output()`.

## Contents

1. [What the project is](#1-what-the-project-is)
2. [Requirements and what I built](#2-requirements-and-what-i-built)
3. [The interface and user experience](#3-the-interface-and-user-experience)
4. [Accessibility: what is done and what still needs checking](#4-accessibility-what-is-done-and-what-still-needs-checking)
5. [Technologies](#5-technologies)
6. [Angular architecture](#6-angular-architecture)
7. [Component interaction: `@Input()` and `@Output()`](#7-component-interaction-input-and-output)
8. [Lifecycle hooks](#8-lifecycle-hooks)
9. [Change detection](#9-change-detection)
10. [Why Angular instead of vanilla JavaScript?](#10-why-angular-instead-of-vanilla-javascript)
11. [Angular, React, Vue and vanilla JavaScript](#11-angular-react-vue-and-vanilla-javascript)
12. [Project structure and how the app starts](#12-project-structure-and-how-the-app-starts)
13. [Implementation decisions](#13-implementation-decisions)
14. [Testing and limitations](#14-testing-and-limitations)
15. [Questions I should be able to answer in my review](#15-questions-i-should-be-able-to-answer-in-my-review)
16. [Running the project](#16-running-the-project)

---

## 1. What the project is

**What it does.** You type or paste text into a box. As you type, the app shows:

- how many characters, words and sentences the text has;
- the character count with or without spaces;
- a warning when the text goes over a limit you set;
- an approximate reading time;
- how often each letter A–Z appears (letter density).

**Who it is for.** Anyone writing to a length limit: social media posts, form fields,
meta descriptions, short essays, CV summaries.

**Why I built it.** It is the hands-on lab for FEM10. The module covers component
hierarchy, component interaction (`@Input()` / `@Output()`), lifecycle hooks and change
detection. The app is small, so the interesting part is not the counting itself but how
the work is split between components and how data moves between them.

**Where it came from.** I first built the same app in vanilla JavaScript: one HTML file,
one CSS file and one script. That version is the design reference. It is kept locally in
`Reference/` and is not committed (see `.gitignore`). The Angular version keeps the same
design and the same counting rules, but reorganises the code into components.

**What it demonstrates.**

- A parent component that owns all shared state (a _single source of truth_).
- Five child components that only receive data (`@Input()`) and report user actions
  (`@Output()`).
- Lifecycle hooks used for real work: loading the theme, recalculating when inputs
  change, removing a listener.
- `OnPush` change detection in the children, and a zoneless Angular 21 app.

---

## 2. Requirements and what I built

### Required by the lab brief

**Status key:** **Done** means implemented, and I checked it against the code. **Check**
means implemented, but it still needs a manual check or confirmation.

| Requested requirement                                       | What I implemented                                                                                               | How it works                                                                                                                                                                                                          | Status                                                                                                                                                            |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Character, word and sentence counts, updated instantly      | Three count cards                                                                                                | `StatsCardsComponent.ngOnChanges` recounts when `text` changes. Words: split on whitespace. Sentences: groups of `.`, `!`, `?`, `…`.                                                                                  | Done                                                                                                                                                              |
| Include or exclude spaces in the character count            | **Exclude Spaces** checkbox                                                                                      | `countCharacters(text, excludeSpaces)` removes all whitespace (`/\s/g`) when the option is on. The card label adds "(no space)".                                                                                      | Done                                                                                                                                                              |
| Set a character limit and get a warning when it is exceeded | **Set Character Limit** checkbox and a number field                                                              | `TextInputComponent.ngOnChanges` compares the count with the limit. Over the limit, the textarea gets `aria-invalid="true"` (orange border) and the message _"Limit reached! Your text exceeds X characters."_ shows. | Done. You can still type past the limit; it warns, it does not block.                                                                                             |
| Approximate reading time                                    | "Approx. reading time" under the textarea                                                                        | A getter in `AppComponent`: words ÷ 200, rounded. Shows `0 minute`, `<1 minute`, `1 minute` or `X minutes`.                                                                                                           | Done                                                                                                                                                              |
| Letter density ("percentage of alphabetic characters")      | A bar for each letter A–Z with count and percentage                                                              | `LetterDensityComponent` counts each letter (case-insensitive) and divides by the total number of letters.                                                                                                            | Done, as I read the requirement: it shows each letter's share of all letters, following the design. It does not show one "letters vs. all characters" percentage. |
| Light and dark themes                                       | Toggle button in the header                                                                                      | `AppComponent` adds or removes the `light-theme` class on `<html>`, which swaps the CSS custom properties.                                                                                                            | Done                                                                                                                                                              |
| Use the whole app with the keyboard                         | Every control is a native element (`<a>`, `<button>`, `<textarea>`, `<input>`)                                   | Native elements are focusable and work with Tab, Space and Enter without extra code.                                                                                                                                  | Check: confirm by hand (see [Testing](#14-testing-and-limitations))                                                                                               |
| Responsive layout                                           | Fluid container, one breakpoint at 767px                                                                         | Flexbox and CSS Grid. On narrow screens the cards stack and the options go into a column.                                                                                                                             | Check: implemented in CSS, not tested on real devices                                                                                                             |
| Hover and focus states on all interactive elements          | Hover: logo, theme toggle, textarea, checkboxes, limit field, See more. Focus: a global `:focus-visible` outline | See [section 3](#3-the-interface-and-user-experience).                                                                                                                                                                | Done                                                                                                                                                              |

The brief also lists these tasks and deliverables:

| Task from the brief                                               | Where                                                                      | Status                                                                                                                 |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Pass data parent → child with `@Input()`                          | All five children ([section 7](#7-component-interaction-input-and-output)) | Done                                                                                                                   |
| Emit events child → parent with `@Output()`                       | `HeaderComponent`, `TextInputComponent`, `SettingsComponent`               | Done                                                                                                                   |
| `ngOnInit`, `ngOnChanges`, optional `ngOnDestroy`                 | All three ([section 8](#8-lifecycle-hooks))                                | Done                                                                                                                   |
| CSS Grid or Flexbox for responsiveness                            | Both                                                                       | Done                                                                                                                   |
| Inspect change detection with `console.log()` or Angular DevTools | `debugLog()` logs every hook during development                            | Done with `console.log`. Angular DevTools: not something the code can show.                                            |
| "Generate the components listed above"                            | Five components under `src/app/components/`                                | Check: the brief I have does not include the component list it refers to, so I cannot confirm that the names match it. |

### Extras I added (not requested)

These came from my vanilla JS design reference:

- Counts padded to two digits (`07`), as in the design.
- **See more / See less** for the letter list (the top 5 are shown first) and a
  "No characters found" message when there is no text.
- Focus moves into the limit field when you turn the limit on.
- `prefers-reduced-motion` support (turns off the arrow rotation) and a high-contrast
  (`forced-colors`) fix for the ticked checkbox.

These are new in the Angular version:

- The theme follows the OS setting on the first visit, and a choice you make is saved in
  `localStorage`.
- The limit warning uses `aria-live="polite"`. The reference used `role="alert"`, which
  interrupts a screen reader immediately.
- `OnPush` change detection in all children, and `required` inputs.
- Lifecycle logs during development only (`isDevMode()`).

---

## 3. The interface and user experience

### Layout

From top to bottom, inside a centred container (at most 990px wide):

```text
┌──────────────────────────────────────────────────────────┐
│ [logo] Character Counter                        [☀ / ☾]  │  HeaderComponent
│                                                          │
│          Analyze your text in real-time.                 │  <h1> in AppComponent
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Start typing here… (or paste your text)              │ │  TextInputComponent
│ └──────────────────────────────────────────────────────┘ │
│  ⓘ Limit reached! Your text exceeds 10 characters.       │  (only when over the limit)
│ [ ] Exclude Spaces  [ ] Set Character Limit [  ]         │  SettingsComponent
│                        Approx. reading time: <1 minute   │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│ │ 07           │ │ 02           │ │ 01           │       │  StatsCardsComponent
│ │ Total Chars  │ │ Word Count   │ │ Sentence Cnt │       │
│ └──────────────┘ └──────────────┘ └──────────────┘       │
│ Letter Density                                           │  LetterDensityComponent
│ E ████████░░░░░░░░░░░░  4 (25.00%)                        │
│ ...                                                      │
│ See more ⌄                                               │
└──────────────────────────────────────────────────────────┘
```

| Section        | Purpose                                                        | Component                |
| -------------- | -------------------------------------------------------------- | ------------------------ |
| Header         | App name (link to `/`) and the theme toggle                    | `HeaderComponent`        |
| Textarea       | Where the user types; shows the limit warning                  | `TextInputComponent`     |
| Options row    | Exclude Spaces, Set Character Limit, limit field, reading time | `SettingsComponent`      |
| Cards          | Characters (purple), words (yellow), sentences (orange)        | `StatsCardsComponent`    |
| Letter Density | Letter bars, See more / See less, empty-state message          | `LetterDensityComponent` |

### What happens when the user…

| Action                    | Result                                                                                                                                              |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| types or pastes           | Cards, reading time, letter density and the limit check all update on every `input` event.                                                          |
| ticks Exclude Spaces      | The character card recounts without whitespace and shows "(no space)". The limit check uses the same count, so the warning can appear or disappear. |
| ticks Set Character Limit | The number field is enabled and receives focus. Nothing is checked until a positive number is entered.                                              |
| goes over the limit       | The textarea border turns orange with an orange glow and the warning appears below it. Typing is not blocked.                                       |
| clicks the theme toggle   | Colours switch at once. The icon changes (sun in dark mode, moon in light mode) and the choice is saved.                                            |
| clicks See more           | All letters are shown, the label becomes "See less" and the arrow turns over.                                                                       |

### Responsive behaviour

There is one breakpoint, `@media (max-width: 767px)`:

- **Desktop and tablet (768px and wider):** the container is `min(990px, 100% - 64px)`
  wide, the three cards sit in a row (`grid-template-columns: repeat(3, 1fr)`), and the
  options row is a horizontal flex row.
- **Mobile (767px and narrower):** the cards stack into one column, the options go into a
  column, the heading shrinks from 64px to 40px, and the theme button shrinks from
  44×44px to 32×32px.

Tablet uses the desktop layout at a smaller width. I have not checked it on real
devices. See [Limitations](#limitations).

### Visual design and themes

- **Colours** are CSS custom properties on `:root` in `src/styles.css`, copied from the
  reference. The dark theme is the default. `:root.light-theme` overrides the same
  variables (`--page-background`, `--text`, `--surface`, `--warning`, …), so no
  component needs a separate light-mode rule.
- **Font:** DM Sans (400, 600, 700) from Google Fonts, loaded in `src/index.html`.
- **Images** in `public/images/`: logo, sun and moon icons, card patterns and the dark
  background.
- **Hover states:** the logo text underlines; the theme toggle and See more fade to 80%
  opacity; the textarea, checkboxes and enabled limit field get a purple border.
- **Focus states:** every focusable element gets a 2px purple `:focus-visible` outline.
  The textarea has its own focus style instead: a purple border and glow.

---

## 4. Accessibility: what is done and what still needs checking

I have not tested the app with a screen reader or an automated checker (axe,
Lighthouse). The tables below say what is in the code, not what has been verified with
assistive technology.

### Implemented

| Question                    | Answer from the code                                                                                                                                                                                                         |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Are form controls labelled? | Yes. The textarea and limit field have visually hidden `<label for>` elements. The checkboxes are wrapped in their `<label>`. The theme button has `aria-label="Light theme"`. The logo link has `aria-label`.               |
| Keyboard use?               | All controls are native elements, so Tab, Shift+Tab, Space and Enter work. There is no custom keyboard code to break. Turning the limit on moves focus into the number field.                                                |
| Visible focus?              | `:focus-visible { outline: 2px solid var(--purple-500); }` everywhere. The textarea uses a border and glow, and keeps a transparent outline so a focus ring still shows in Windows high-contrast mode.                       |
| Dynamic updates announced?  | `aria-live="polite"` on the limit warning (with `aria-atomic="true"`), the stats list and the reading time.                                                                                                                  |
| ARIA states?                | `aria-pressed` on the theme toggle (a toggle button with a fixed label). `aria-expanded` and `aria-controls` on See more. `aria-invalid` and `aria-describedby` on the textarea. `aria-hidden` on decorative bars and icons. |
| Reduced motion?             | Yes. `@media (prefers-reduced-motion: reduce)` turns off transitions and animations.                                                                                                                                         |
| High-contrast mode?         | `@media (forced-colors: active)` keeps the ticked checkbox visible.                                                                                                                                                          |
| Page structure?             | `lang="en"`, one `<h1>`, an `<h2>` for Letter Density, `<header>` and `<main>` landmarks, labelled sections.                                                                                                                 |

### Needs checking or improving

- **Noisy live regions.** The stats list and reading time are `aria-live`, so a screen
  reader may read the counts after every keystroke. This needs testing; announcing only
  the warning may be better.
- **Warning announcement.** The warning `<p>` is hidden with `display: none` until the
  limit is exceeded. Some screen readers do not announce a live region that was hidden
  when its content changed. Needs testing.
- **Colour contrast** has not been measured, for example orange warning text on the dark
  background, or dark text on the coloured cards.
- **Mobile theme button** is 32×32px. That is above the WCAG 2.2 AA minimum target size
  (24×24px) but below the commonly recommended 44×44px.
- **Limit field validation.** `0`, negative numbers and decimals are accepted by the
  field. `0` and negative numbers are silently ignored, with no message saying why.
- **The logo link** (`href="/"`) reloads the page, which clears the text without asking.

---

## 5. Technologies

| Technology                           | What it is                                                | Why I used it here                                                                                                     | Where it appears                                                                     | Responsibility                                                                  |
| ------------------------------------ | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| **Angular 21** (installed: 21.2.26)  | A front-end framework for building apps out of components | It is the subject of the module: components, inputs/outputs, lifecycle hooks, change detection                         | `@angular/core`, `@angular/common`, `@angular/compiler`, `@angular/platform-browser` | Components, templates, data binding, lifecycle, change detection, bootstrapping |
| **Angular CLI and `@angular/build`** | The command-line tool and the build system                | Creates, serves and builds the project without manual bundler setup                                                    | `angular.json`, `npm start`, `npm run build`                                         | Dev server, compiling templates and TypeScript, bundling, production output     |
| **TypeScript ~5.9**                  | JavaScript with static types                              | Angular is written for TypeScript. Types catch mistakes such as passing a string where a `number \| null` is expected. | Every `.ts` file. `tsconfig.json` has `"strict": true` and `"strictTemplates": true` | Type-checking components, inputs, outputs and templates at build time           |
| **HTML / Angular templates**         | HTML with Angular binding syntax                          | Describes what the page should show for the current state                                                              | `*.component.html`                                                                   | `{{ }}` text, `[property]` bindings, `(event)` listeners, `@for` loops          |
| **CSS**                              | Plain CSS, no preprocessor                                | The design was already plain CSS in the reference. Custom properties make theming one class change.                    | `src/styles.css` (global), `*.component.css` (per component)                         | Layout (Flexbox, Grid), themes, hover and focus states, responsive rules        |
| **RxJS ~7.8**                        | A library for event streams                               | Not used directly. Angular depends on it: `EventEmitter` is built on an RxJS `Subject`.                                | `package.json` only                                                                  | Underneath every `@Output()`                                                    |
| **DM Sans** (Google Fonts)           | A web font                                                | The font of the design                                                                                                 | `<link>` in `src/index.html`                                                         | Typography                                                                      |
| **Images**                           | SVG and PNG assets                                        | From the design                                                                                                        | `public/images/`                                                                     | Logo, theme icons, card patterns, dark background                               |
| **npm**                              | The package manager                                       | Installs Angular and runs the scripts                                                                                  | `package.json`: `start` (`ng serve`), `build` (`ng build`), `ng`                     | Dependencies and commands                                                       |
| **Prettier 3**                       | A code formatter                                          | Consistent formatting                                                                                                  | `.prettierrc` (100-character lines, single quotes, Angular parser for HTML)          | Formatting (run with `npx prettier --write .`; there is no npm script)          |
| **EditorConfig**                     | Editor settings file                                      | Same indentation and line endings in any editor                                                                        | `.editorconfig`                                                                      | 2-space indentation, UTF-8, final newline                                       |

**What is deliberately not used.** No router (one page), no `FormsModule` (two inputs and
two checkboxes, handled with `[value]` and `(input)`), no HTTP client (no server), no state
library (state fits in one parent), no UI kit (the design is custom), no zone.js (see
[section 9](#9-change-detection)). Every dependency in `package.json` is something the
app or the build needs.

---

## 6. Angular architecture

### Component hierarchy

```text
AppComponent                   root, the parent; owns all shared state
├── HeaderComponent            logo and theme toggle
├── TextInputComponent         textarea and limit warning
├── SettingsComponent          Exclude Spaces, Set Character Limit, limit field, reading time
├── StatsCardsComponent        character, word and sentence cards
└── LetterDensityComponent     letter bars, See more / See less
```

The hierarchy is one level deep: every child is used directly in
`app.component.html`, and no child contains another child component.

### What each component is responsible for

| Component                | Responsibility                                                                              | Receives                                                | Emits                                                      | Keeps privately                                           |
| ------------------------ | ------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------- |
| `AppComponent`           | Holds the state, handles every event, works out reading time, loads/saves/follows the theme | none (it is the root)                                   | none                                                       | `text`, `excludeSpaces`, `limitEnabled`, `limit`, `theme` |
| `HeaderComponent`        | Shows the logo and the right icon; reports a toggle click                                   | `theme`                                                 | `themeToggle`                                              | none                                                      |
| `TextInputComponent`     | Shows the textarea; decides whether the text is over the limit                              | `text`, `limit`, `limitEnabled`, `excludeSpaces`        | `textChange`                                               | `isOverLimit`, `warningMessage` (derived)                 |
| `SettingsComponent`      | Shows the options and reading time; reports changes                                         | `excludeSpaces`, `limitEnabled`, `limit`, `readingTime` | `excludeSpacesChange`, `limitEnabledChange`, `limitChange` | none                                                      |
| `StatsCardsComponent`    | Counts characters, words and sentences and formats them                                     | `text`, `excludeSpaces`                                 | none                                                       | the three formatted counts (derived)                      |
| `LetterDensityComponent` | Counts letters, sorts them, shows 5 or all                                                  | `text`                                                  | none                                                       | `letterCounts` (derived), `showAll`                       |

Shared counting functions that more than one component needs are plain functions in
`src/app/text-stats.ts`: `countCharacters()` (TextInput and StatsCards) and
`countWords()` (StatsCards and AppComponent).

### Why split the page this way

- **One job each (separation of concerns).** Each component matches one area of the
  design. To change how sentences are counted, you open `StatsCardsComponent` and
  nothing else.
- **Children are "presentational".** They do not know where their data comes from or
  who listens to their events. `StatsCardsComponent` would work with any `text`, for
  example from a file or a server.
- **Easier to maintain.** Each component has its own template, styles (scoped to that
  component by Angular) and class. A CSS rule in `stats-cards.component.css` cannot
  accidentally change the header.
- **Visible data flow.** All the wiring is in one 35-line template,
  `app.component.html`. Reading it tells you exactly what each child gets and what it
  can report.

### Where state lives: a single source of truth

"Single source of truth" means every piece of shared data is stored in **one** place.
Here that place is `AppComponent`:

```ts
// src/app/app.component.ts
text = '';
excludeSpaces = false;
limitEnabled = false;
limit: number | null = null;
theme: Theme = 'dark';
```

`excludeSpaces` is a good example of why this matters. It is needed by three
components: Settings shows the checkbox, StatsCards counts with it, and TextInput uses
it for the limit check. If each kept its own copy, they could disagree. Because the
parent owns it, all three always receive the same value.

**State that stays in a child.** `showAll` (is the letter list expanded?) lives in
`LetterDensityComponent`. No other component needs it, so moving it to the parent would
only add an input, an output and a handler for no benefit.

**Derived values are not stored as state.** `readingTime` is a getter calculated from
`text`, and the counts in StatsCards are recalculated from `text`. Storing them
separately would create a second copy of the same information that could go out of
date.

---

## 7. Component interaction: `@Input()` and `@Output()`

### The two directions

| Decorator   | Direction      | What it carries                 | Template syntax in the parent                         |
| ----------- | -------------- | ------------------------------- | ----------------------------------------------------- |
| `@Input()`  | parent → child | **data** (a value)              | `[text]="text"` (property binding)                    |
| `@Output()` | child → parent | **events** (something happened) | `(textChange)="onTextChange($event)"` (event binding) |

- **`@Input()`** marks a class property that the parent can set from its template.
  When the parent's value changes, Angular writes the new value into the child's
  property and calls the child's `ngOnChanges`.
- **`@Output()`** marks a property the parent can listen to. It holds an
  **`EventEmitter`**.
- **`EventEmitter<T>`** is Angular's event object (it extends an RxJS `Subject`).
  Calling `emit(value)` immediately calls every listener with that value. In the
  parent's template, that value is available as `$event`.

**Passing data versus emitting events.** An input is a _state_: "the text is `abc`". An
output is a _message_: "the user just typed; here is what the textarea now contains".
The child does not decide what happens next. The parent does.

### Why a child must not change the parent's state

If `TextInputComponent` could write `parent.text = ...` directly:

- the child would depend on one specific parent and could not be reused;
- any child could change shared state, so you could not find _who_ changed it by reading
  the template;
- two children could change the same value in different ways.

With outputs, every change goes through one handler in the parent, and you can trace
every possible change from `app.component.html`.

### The real wiring

```html
<!-- src/app/app.component.html (excerpt) -->
<app-text-input
  [text]="text"
  [limit]="limit"
  [limitEnabled]="limitEnabled"
  [excludeSpaces]="excludeSpaces"
  (textChange)="onTextChange($event)"
/>
```

```ts
// src/app/components/text-input/text-input.component.ts (excerpt)
@Input({ required: true }) text = '';
@Input() limit: number | null = null;
@Input() limitEnabled = false;
@Input() excludeSpaces = false;

@Output() textChange = new EventEmitter<string>();

onInput(event: Event): void {
  this.textChange.emit((event.target as HTMLTextAreaElement).value);
}
```

```ts
// src/app/app.component.ts
onTextChange(text: string): void {
  this.text = text;
}
```

`required: true` means the parent's template **must** bind that input. If I removed
`[text]="text"`, the build would fail instead of the app silently showing nothing.

### Full map of inputs and outputs

```text
AppComponent  (state: text, excludeSpaces, limitEnabled, limit, theme; derived: readingTime)
│
├── HeaderComponent
│     @Input   theme                ◄── theme
│     @Output  themeToggle          ──► onThemeToggle()
│
├── TextInputComponent
│     @Input   text                 ◄── text
│     @Input   limit                ◄── limit
│     @Input   limitEnabled         ◄── limitEnabled
│     @Input   excludeSpaces        ◄── excludeSpaces
│     @Output  textChange           ──► onTextChange($event)
│
├── SettingsComponent
│     @Input   excludeSpaces        ◄── excludeSpaces
│     @Input   limitEnabled         ◄── limitEnabled
│     @Input   limit                ◄── limit
│     @Input   readingTime          ◄── readingTime
│     @Output  excludeSpacesChange  ──► onExcludeSpacesChange($event)
│     @Output  limitEnabledChange   ──► onLimitEnabledChange($event)
│     @Output  limitChange          ──► onLimitChange($event)
│
├── StatsCardsComponent
│     @Input   text                 ◄── text
│     @Input   excludeSpaces        ◄── excludeSpaces
│
└── LetterDensityComponent
      @Input   text                 ◄── text
```

### The cycle as a diagram

```text
              ┌──────────────── AppComponent ─────────────────┐
              │  state: text = 'ab'                           │
              │  onTextChange(t) { this.text = t; }           │
              └───────▲───────────────────────────┬───────────┘
   (2) emit 'abc'     │ (textChange)              │ [text]  (4) new value 'abc'
   via @Output        │                           ▼ via @Input
              ┌───────┴───────────────────────────────────────┐
              │  TextInputComponent                           │
              │  (1) user types 'c' → (input) → onInput()     │
              └───────────────────────────────────────────────┘
          (3) the parent's handler updates its own state
```

### Step by step: typing one character

Say the textarea contains `ab` and the user types `c`.

1. The browser fires an `input` event on the textarea.
2. Angular runs the template listener `(input)="onInput($event)"` in
   `TextInputComponent`. Because a template event fired, Angular marks this component
   and its parent as needing a check and schedules change detection.
3. `onInput()` reads `abc` from the textarea and calls `this.textChange.emit('abc')`.
4. The `EventEmitter` immediately calls the parent's listener:
   `onTextChange('abc')` sets `this.text = 'abc'`. **The state has changed, but the page
   has not been updated yet.**
5. Change detection runs. Angular checks `AppComponent`'s template and compares each
   binding with its previous value:
   - `[text]` on TextInput, StatsCards and LetterDensity: `'ab'` → `'abc'`, changed;
   - `[readingTime]` on Settings: the getter runs again but still returns `<1 minute`, unchanged;
   - `[theme]` on Header, `[limit]` and the others: unchanged.
6. For each child with a changed input, Angular sets the property and calls its
   `ngOnChanges`. TextInput re-checks the limit, StatsCards recounts, LetterDensity
   rebuilds the list.
7. Angular checks those children's templates and updates only the DOM that changed: the
   card numbers, the letter rows and, if needed, the warning.
8. `HeaderComponent` and `SettingsComponent` are `OnPush` and none of their inputs
   changed, so Angular skips them.

The same round trip happens for every output. For example, Settings emits
`excludeSpacesChange(true)`, then the parent sets `excludeSpaces = true`, then the new
value goes down to Settings, TextInput and StatsCards.

---

## 8. Lifecycle hooks

A **lifecycle hook** is a method Angular calls at a specific moment in a component's
life: when it is created, when its inputs change, when it is destroyed. You use one by
implementing the interface (`OnInit`, `OnChanges`, `OnDestroy`) and adding the method.

### Order

For a child component with bound inputs:

```text
constructor  →  ngOnChanges (first)  →  ngOnInit  →  …  ngOnChanges (each later input change)  …  →  ngOnDestroy
```

- The **constructor** runs when Angular creates the class. Inputs are **not set yet**:
  they still have their default values. Use it for dependency injection and simple field
  setup only.
- **`ngOnChanges`** runs first because Angular sets the inputs and then tells the
  component about them. The first call has `firstChange: true` for every input.
- **`ngOnInit`** runs once, **after** the first `ngOnChanges`. At that point all inputs
  have their first values. (If a component has no bound inputs, `ngOnChanges` is not
  called and `ngOnInit` comes first.)
- A parent's `ngOnInit` runs before its children are initialised, which is why
  `[App] ngOnInit` is the first log line on page load.

### `ngOnInit`: `AppComponent`

```ts
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
```

- **When:** once, when the app starts.
- **What it does:** reads `localStorage`. If nothing is saved, it uses the
  `prefers-color-scheme` media query. Then it starts listening for OS theme changes.
- **Why here:** this is one-time setup work with side effects (reading storage, adding a
  listener, changing `<html>`). `ngOnInit` is the standard place for that, and it keeps
  the constructor simple.
- **If misused:** setup done in the constructor of a _child_ would see default input
  values, not the real ones. For the root component it would work, but it would mix
  creation with setup.

### `ngOnChanges`: three children

**TextInputComponent**: re-checks the limit whenever any of its four inputs changes:

```ts
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
```

**StatsCardsComponent**: uses `SimpleChanges` to recalculate **only** what is affected:

```ts
ngOnChanges(changes: SimpleChanges): void {
  if (changes['text'] || changes['excludeSpaces']) {
    this.characterCount = this.formatCount(countCharacters(this.text, this.excludeSpaces));
  }

  if (changes['text']) {
    this.wordCount = this.formatCount(countWords(this.text));
    this.sentenceCount = this.formatCount(this.countSentences());
  }
}
```

Ticking Exclude Spaces does not change words or sentences, so only the character count
is recalculated. (`changes['text']` uses brackets because `SimpleChanges` is an index
type and `tsconfig.json` has `noPropertyAccessFromIndexSignature`.)

**LetterDensityComponent**: uses `ngOnInit` for the first build and `ngOnChanges` for
the later ones:

```ts
ngOnInit(): void {
  debugLog('[LetterDensity] ngOnInit: initial density');
  this.updateDensity();
}

ngOnChanges(changes: SimpleChanges): void {
  const textChange = changes['text'];
  if (textChange && !textChange.firstChange) {
    this.updateDensity();
  }
}
```

Honest note: `ngOnChanges` alone would be enough here, because the first `ngOnChanges`
also runs with the initial text. I split it on purpose to show the order of the two
hooks and the `firstChange` flag. `firstChange` stops the list from being built twice.

- **Why `ngOnChanges` in these components:** their displayed values depend only on their
  inputs, so "an input changed" is exactly the moment to recalculate. The work happens
  once per change, not on every change detection pass.
- **If omitted:** the warning, counts and letters would never update after the first
  render. You would have to use getters instead, which run on every check.
- **A trap:** `ngOnChanges` only fires when the input gets a **new value** (a new
  reference for objects). If a parent changed a property _inside_ an object it had
  already passed down, `ngOnChanges` would not run. All inputs here are strings,
  numbers and booleans, so this cannot happen in this app.

### `ngOnDestroy`: `AppComponent`

```ts
ngOnDestroy(): void {
  debugLog('[App] ngOnDestroy: removing prefers-color-scheme listener');
  this.lightSchemeQuery.removeEventListener('change', this.onSystemThemeChange);
}
```

- **When:** once, just before Angular destroys the component.
- **Why:** the media-query listener is registered with the browser, not with Angular.
  Angular cannot remove it automatically.
- **If omitted:** the browser would keep a reference to the destroyed component (a memory
  leak) and keep calling `setTheme()` on it. For the root component this only happens
  when the whole app is torn down, so in this app it is mainly good practice. In a child
  that is created and destroyed many times, it would be a real bug.
- `onSystemThemeChange` is an **arrow function stored in a property**. That way
  `addEventListener` and `removeEventListener` get the same function object, and `this`
  still points to the component. A normal method passed as `this.method.bind(this)`
  would create a new function each time and could not be removed.

### Why not put everything in the constructor?

1. **Inputs are not set in the constructor**, so a child cannot compute anything from
   them there.
2. **Changes happen later.** The constructor runs once; `ngOnChanges` runs on every new
   input value.
3. **Clean-up needs a matching hook.** There is no "destructor" in JavaScript;
   `ngOnDestroy` is Angular's equivalent.
4. **Separation.** The constructor is for creating the object (Angular uses it for
   dependency injection); hooks are for behaviour at specific moments.

---

## 9. Change detection

### What it is

**Change detection** is how Angular keeps the page in sync with the component data.
The data is the _state_ (for example `this.text`). The page is the _DOM_ (for example
the number on the card). Changing the state does **not** change the DOM by itself.
Change detection is the step that copies the new values into the DOM.

During a change detection pass Angular:

1. walks the component tree from the root down;
2. for each component it checks, evaluates every template binding (`{{ characterCount }}`,
   `[value]="text"`, `[hidden]="!isOverLimit"`, `[text]="text"`, …);
3. compares each result with the value it stored last time;
4. if a value is different, updates only that DOM property, text node or child input,
   and stores the new value.

Angular compiles each template into instructions that do exactly this. There is no
virtual DOM: Angular compares binding _values_, not trees of elements.

### Re-rendering versus change detection

In Angular, "re-rendering" does not mean rebuilding the component. The DOM elements of
a component are created **once**. After that, change detection only updates the parts
whose bindings changed: a text node, a property, an attribute. Elements are created or
removed only by control flow. Here that is `@for` in Letter Density: with
`track item.letter` it adds, removes or moves only the rows whose letter changed. (React
is different: it re-runs the component function and compares the output.)

That is also why I used `[hidden]` rather than `@if` for the limit warning. The element
stays in the DOM, so `aria-describedby="limit-warning"` always points to an existing
element and the live region already exists before its text changes.

### What starts change detection in this project

Change detection does not run constantly. Something has to tell Angular that state may
have changed. In this app there are only these triggers:

| Trigger                      | Example in the app                                                                                                                |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| An event bound in a template | `(input)` on the textarea, `(change)` on the checkboxes, `(input)` on the limit field, `(click)` on the theme toggle and See more |
| An explicit `markForCheck()` | The OS theme listener in `AppComponent`                                                                                           |

There are no timers, HTTP requests or signals in this app.

### Zone.js, and why this app does not use it

**What Zone.js is.** Zone.js is a library that _patches_ the browser's asynchronous
APIs (`addEventListener`, `setTimeout`, `Promise`, `fetch`/XHR, …) so that it knows
when any asynchronous task starts and finishes.

**What problem it solved.** For years Angular apps used Zone.js so that developers never
had to tell Angular "something changed". After **any** async task finished, Zone.js
notified Angular, and Angular ran change detection over the app. Zone.js itself never
touches the DOM. It only answers the question "when should Angular check?". Change
detection is what updates the DOM.

**What this project uses.** This project is **zoneless**. It runs Angular 21.2, where
new projects are zoneless by default. `zone.js` is not in `package.json`, there is no
`polyfills` entry in `angular.json`, and `main.ts` adds no zone provider. Without
Zone.js, Angular schedules change detection only when it is notified: by a template
event, by `markForCheck()`, by a signal update or by the `async` pipe.

**Why that matters.**

- A smaller bundle, no patched browser APIs, and no change detection after unrelated
  async work.
- **Code that changes state outside a template event must notify Angular itself.**
  That is the one place this app needed extra code:

```ts
// src/app/app.component.ts
private onSystemThemeChange = (event: MediaQueryListEvent): void => {
  if (this.readSavedTheme() === null) {
    this.setTheme(event.matches ? 'light' : 'dark');
    // This listener is not a template event, so Angular does not know the state
    // changed. markForCheck() asks it to run change detection and update the header.
    this.changeDetector.markForCheck();
  }
};
```

What would go wrong without `markForCheck()` here: `setTheme()` changes the class on
`<html>` directly, so the **colours would still switch**. But `this.theme` is only passed
to `HeaderComponent` during change detection. The header would keep the wrong icon and
the wrong `aria-pressed` value until the next click or keystroke. (I fixed exactly this
bug in commit `ed70da7`.) With Zone.js, the patched `addEventListener` would have started
change detection automatically and `markForCheck()` would not be needed.

### `ChangeDetectionStrategy.OnPush`

By default (`ChangeDetectionStrategy.Default`), Angular checks a component on **every**
change detection pass. With **`OnPush`**, Angular skips the component unless:

1. one of its `@Input()`s received a **new value** from the parent's template;
2. an event bound in **its own** template (or a child's) fired;
3. it was marked with `markForCheck()`;
4. a signal or `async` pipe used in its template produced a new value.

All five children use it:

```ts
// OnPush: only re-check this component when one of its @Inputs gets a new value
// or one of its own template events fires (it depends on nothing else).
changeDetection: ChangeDetectionStrategy.OnPush,
```

**Why OnPush is right for them.** What each child displays depends only on its inputs and
its own events, which are exactly the cases where OnPush still checks it. So OnPush
cannot make a child show stale data here; it only removes checks that would find nothing
new. `AppComponent` stays on Default because it is the root and holds the state.

**Input change versus internal event.**

- **Input change:** typing changes `text`, so StatsCards is checked because its `[text]`
  input got a new value. `ngOnChanges` runs first.
- **Internal event:** clicking See more changes `showAll` inside LetterDensity. No input
  changed, so `ngOnChanges` does **not** run, but the click was a template event in that
  component, so Angular still checks it and the list expands.

### `markForCheck()`

`ChangeDetectorRef.markForCheck()` marks a component **and all its ancestors** as needing
a check, so they are not skipped by OnPush. In a zoneless app it also asks Angular to
schedule a change detection pass. It does **not** run change detection immediately.
(`detectChanges()` would run it immediately, for that component only.)

### Watching it happen

During development, every hook logs a line to the browser console through `debugLog()`
in `src/app/debug.ts`. See [Testing](#14-testing-and-limitations) for what to expect.

---

## 10. Why Angular instead of vanilla JavaScript?

> _"Your original Character Counter was already working with vanilla JavaScript. Why did
> you rebuild it with Angular? What did Angular actually bring to the project?"_

### The honest short answer

The vanilla version works, and for an app this small vanilla JavaScript is a perfectly
good choice. I rebuilt it in Angular because the lab is about Angular components. The
same features let me practise parent/child structure, inputs and outputs, lifecycle
hooks and change detection on something I already understood. The rebuild did not add
any feature that plain JavaScript could not do. What changed is **how the code is
organised and who keeps the page in sync**.

### The same task in both versions

**The reference recalculates everything on every event and updates the DOM by hand:**

```js
// Reference/javascript.js
function updateStats() {
  const text = textInput.value;
  const characters = countCharacters(text);
  const words = countWords(text);

  characterCount.textContent = formatNumber(characters);
  wordCount.textContent = formatNumber(words);
  sentenceCount.textContent = formatNumber(countSentences(text));
  noSpaceNote.hidden = !excludeSpaces.checked;
  readingTime.textContent = getReadingTime(words);

  updateLimitWarning(characters);
  updateLetterDensity(text);
}

textInput.addEventListener('input', updateStats);
excludeSpaces.addEventListener('change', updateStats);
limitInput.addEventListener('input', updateStats);
```

**The Angular version describes what to show and lets Angular update it:**

```html
<!-- stats-cards.component.html -->
<p class="stat-number">{{ characterCount }}</p>
...
<span class="stat-note" [hidden]="!excludeSpaces"> (no space)</span>
```

| Topic                              | Vanilla JS reference                                                                                                     | Angular version                                                                                                                                                                             |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Structure**                      | One 158-line `javascript.js` with global functions and 17 `getElementById` lookups                                       | Six components, each with its own template, CSS and class, plus two small helper files                                                                                                      |
| **Where state lives**              | In the DOM. Code reads `excludeSpaces.checked` and `limitInput.value` when it needs them.                                | In `AppComponent` properties. The DOM is drawn from them.                                                                                                                                   |
| **Updating the page**              | Manual: `textContent = …`, `hidden = …`, `setAttribute(…)`. Forget one, and the page is out of date.                     | Declarative bindings: `{{ }}`, `[hidden]`, `[attr.aria-pressed]`. Change detection keeps them in sync.                                                                                      |
| **What reruns**                    | `updateStats()` recalculates everything (counts, warning, letter list) for every event, even when only the limit changed | `ngOnChanges` + `SimpleChanges` tell each component which input changed. Changing the limit only re-runs TextInput's check.                                                                 |
| **Lists**                          | The density list is rebuilt as an HTML string and replaced with `innerHTML` every time                                   | `@for (…; track item.letter)` updates only changed rows, and interpolated values are escaped automatically                                                                                  |
| **Communication**                  | Any function can read or change any element                                                                              | Components only talk through `@Input()` / `@Output()`, and all of it is visible in `app.component.html`                                                                                     |
| **Set-up and clean-up**            | Code at the bottom of the script; listeners are never removed                                                            | `ngOnInit` for set-up, `ngOnDestroy` for clean-up                                                                                                                                           |
| **Mistakes caught**                | A wrong element id gives `null` at runtime                                                                               | TypeScript and `strictTemplates` catch wrong names, wrong input types and missing required inputs at build time                                                                             |
| **CSS**                            | One global stylesheet                                                                                                    | Global theme variables plus CSS scoped to each component                                                                                                                                    |
| **Theme**                          | Toggles a class on `<body>`; not saved, ignores the OS setting                                                           | Toggles a class on `<html>`, saved in `localStorage`, follows the OS setting until the user chooses (this improvement is not Angular-specific)                                              |
| **Focus after enabling the limit** | `limitInput.disabled = false; limitInput.focus();`, works immediately because the DOM is changed directly                | The field is disabled through `[disabled]="!limitEnabled"`, which only updates after the parent's state comes back down, so Settings waits with `afterNextRender(() => limitInput.focus())` |

The last row is a good example of the trade-off. In vanilla JS you control the DOM
directly, so it is simple. In Angular the DOM follows the state, so you have to wait
for Angular to apply the state before you can focus the field.

### What Angular brings

- **Components:** reusable, self-contained pieces. `<app-stats-cards [text]="…" />`
  works with any text. The vanilla cards are tied to fixed element ids on one page.
- **Separation of concerns:** counting, warning, settings and display live in different
  files with clear boundaries.
- **Structured parent-child communication:** data down, events up, and nothing else.
- **Declarative binding:** the template says _what_ the page looks like for a given
  state, not _how_ to change it.
- **Automatic UI sync:** change the state, and change detection updates the DOM.
- **Lifecycle:** clear moments to set up, react to changes and clean up.
- **TypeScript and template checking:** many mistakes become build errors.
- **Scaling:** as an app grows to many screens, routes, forms and server calls, Angular
  provides a standard way to organise all of it (router, forms, HTTP, dependency
  injection, CLI), so different developers write code that looks the same.

### The costs

- **More setup and more files:** about 495 lines of TypeScript across 8 files, plus
  templates and config, versus one 158-line script.
- **A build step:** Node.js, npm and the CLI are needed. The vanilla version opens
  directly in a browser.
- **Bigger download:** the production build's initial JavaScript is about 132 kB raw
  (about 39 kB compressed), mostly Angular itself. The reference script is 5 kB.
- **A learning curve:** decorators, change detection, OnPush and lifecycle order all
  have to be understood. The `markForCheck()` bug in section 9 is an example of a
  problem vanilla JS does not have.

### When Angular would NOT be the best choice

- a small widget or a single interactive element on a mostly static page;
- a content site where load size and speed matter most;
- a quick prototype or a one-off tool;
- a team that does not know Angular and has no time to learn it.

For this Character Counter on its own, vanilla JavaScript is enough. Angular makes sense
here because of the learning goal, and it would make more sense if the app grew, for
example with saved documents, user accounts or several pages.

---

## 11. Angular, React, Vue and vanilla JavaScript

**Framework or library?** A **library** is code you call when you need it. A
**framework** gives the app its structure and calls your code. React describes itself
as a library for building user interfaces. Angular is a full framework. Vue calls itself
a "progressive framework": you can start small and add its official router and state
tools as needed.

|                      | Angular                                                                       | React                                                                       | Vue                                                             | Vanilla JS                                  |
| -------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------- |
| **Type**             | Full framework                                                                | UI library                                                                  | Progressive framework                                           | No framework                                |
| **Components**       | TypeScript class with a decorator, separate HTML template and CSS             | Functions that return JSX                                                   | Single-file components (`.vue`) with template, script and style | None built in (Web Components are possible) |
| **Data down**        | `@Input()` / `input()`                                                        | props                                                                       | props (`defineProps`)                                           | function arguments, DOM reads               |
| **Events up**        | `@Output()` + `EventEmitter` / `output()`                                     | callback functions passed as props                                          | `emit` (`defineEmits`)                                          | DOM events, custom events                   |
| **Updating the UI**  | Change detection compares template bindings; signals for fine-grained updates | Re-runs the component on state change and compares the result (virtual DOM) | Reactive proxies track which data each part uses and update it  | Manual DOM updates                          |
| **Lifecycle**        | `ngOnInit`, `ngOnChanges`, `ngOnDestroy`, …                                   | `useEffect` and its clean-up function                                       | `onMounted`, `onUnmounted`, `watch`, …                          | Your own code                               |
| **Included tools**   | CLI, router, forms, HTTP client, dependency injection, testing setup          | Choose your own (often through a meta-framework like Next.js)               | Official router (Vue Router) and store (Pinia), CLI (Vite)      | Nothing                                     |
| **Language**         | TypeScript by default                                                         | JavaScript or TypeScript                                                    | JavaScript or TypeScript                                        | JavaScript                                  |
| **Typical strength** | Large, long-lived apps and teams that want one standard structure             | Flexibility and a very large ecosystem                                      | A gentle learning curve and simple templates                    | No dependencies, smallest output            |

None of these is "best" in general. **For this lab Angular was the right choice**,
because the module is specifically about Angular's `@Input()`, `@Output()`, lifecycle
hooks and change detection. Interestingly, Vue's props/emits model is very close to
Angular's inputs/outputs, and React's props-plus-callbacks is the same "data down,
events up" idea with different syntax.

---

## 12. Project structure and how the app starts

```text
.
├── angular.json                     project and build configuration (builder, assets, budgets)
├── package.json                     dependencies and npm scripts
├── tsconfig.json                    strict TypeScript + strict template checks
├── tsconfig.app.json                which files are compiled for the app
├── .prettierrc / .editorconfig      formatting rules
├── public/
│   └── images/                      logo, theme icons, card patterns, dark background (copied to the build output as-is)
└── src/
    ├── index.html                   the single HTML page; contains <app-root>, loads DM Sans
    ├── main.ts                      entry point: bootstrapApplication(AppComponent)
    ├── styles.css                   global: colour tokens, light/dark variables, base rules, focus outline, reduced motion
    └── app/
        ├── app.component.ts         the parent: state, event handlers, theme hooks, reading time
        ├── app.component.html       the wiring: every [input] and (output) binding
        ├── app.component.css        page container and <h1>
        ├── text-stats.ts            countCharacters(), countWords(): shared by several components
        ├── debug.ts                 debugLog(): lifecycle logs, on in development only
        └── components/
            ├── header/              logo + theme toggle
            ├── text-input/          textarea + limit warning
            ├── settings/            options + reading time
            ├── stats-cards/         the three cards
            └── letter-density/      letter bars + See more
```

Each component folder has the same three files: `*.component.ts` (class),
`*.component.html` (template) and `*.component.css` (styles scoped to that component).

### From page load to a running app

1. The browser loads `index.html`. In the build, Angular adds the `<script>` and
   stylesheet tags for the bundled `main-….js` and `styles-….css`.
2. The page contains an empty `<app-root></app-root>` element.
3. `main.ts` runs:

   ```ts
   bootstrapApplication(AppComponent).catch((err) => console.error(err));
   ```

4. Angular creates the application, finds the element matching
   `AppComponent`'s selector (`app-root`) and creates `AppComponent` there. No extra
   providers are passed, because the app needs no router, HTTP client or other
   services.
5. The first change detection pass runs: `AppComponent.ngOnInit` loads the theme, then
   Angular renders the template. That creates the five children, passes their inputs
   (first `ngOnChanges`) and runs their `ngOnInit`.
6. From then on, the app waits for events (see [section 9](#9-change-detection)).

### Standalone components

All components are **standalone**: each one lists what it uses in its own `imports`
array, and there is no `NgModule`.

```ts
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
```

In older Angular, components were declared in an `@NgModule`, and the module decided what
its templates could use. Since Angular 19, components are standalone by default, so
`standalone: true` is no longer written. Standalone components make dependencies visible
in the component itself and need less boilerplate.

---

## 13. Implementation decisions

| Decision                                                   | Alternative                                                  | Why this choice fits the lab                                                                                                                                                                        |
| ---------------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared state in `AppComponent`                             | A shared service, or a store (NgRx)                          | One parent and five children one level deep. A service would let children skip the inputs/outputs the lab is about. A store is meant for large apps.                                                |
| `showAll` inside `LetterDensityComponent`                  | Store it in the parent                                       | No other component needs it. Keeping UI-only state local avoids an unnecessary input, output and handler.                                                                                           |
| `@Input()` / `@Output()` decorators                        | Signal-based `input()` / `output()`                          | The module teaches the decorators and `ngOnChanges`. Signal inputs are the newer API and would mostly replace `ngOnChanges` with `computed()`. This is a natural next step.                         |
| `[value]` + `(input)` / `[checked]` + `(change)`           | `[(ngModel)]` with `FormsModule`                             | Two-way binding would hide the explicit child → parent → child round trip. It is also an extra module for four simple controls.                                                                     |
| `ngOnChanges` for derived values in children               | Getters in the template, or input setters                    | Getters run on **every** check; `ngOnChanges` runs only when an input changes. Setters handle one input at a time; `ngOnChanges` sees them all together (TextInput needs four).                     |
| A getter for `readingTime` in the parent                   | Store it and update it in `onTextChange()`                   | It is a cheap calculation and is always correct. Trade-off: it runs every time `AppComponent` is checked.                                                                                           |
| `OnPush` in all children                                   | Default strategy                                             | Children depend only on inputs and their own events, so OnPush is safe and skips unnecessary checks. It also shows the change-detection lesson.                                                     |
| `[hidden]` for the warning, the empty message and See more | `@if` blocks                                                 | Keeps the elements in the DOM, so ARIA references (`aria-describedby`, `aria-controls`) always point to existing elements.                                                                          |
| Shared counting functions in `text-stats.ts`               | A service with `@Injectable`                                 | They are pure functions with no state or dependencies. A plain function is simpler and easier to test.                                                                                              |
| `afterNextRender()` to focus the limit field               | `setTimeout`, or enabling the field directly in the DOM      | The field is enabled by the parent's state on the next render. `afterNextRender` runs exactly after that render. (It is not part of the module. I used it to keep the reference's focus behaviour.) |
| Plain CSS + custom properties                              | SCSS, Tailwind, Angular Material                             | The design was already plain CSS. Variables make theming one class change. The lab is about components, not styling tools.                                                                          |
| Theme class on `<html>`                                    | A class on a component, or `[class]` bindings in every child | The CSS variables are on `:root`, so one class on the root element re-themes everything, including the page background.                                                                             |
| `localStorage` for the theme                               | Cookies, a server, or not saving                             | No server is involved, it is synchronous and simple, and reads and writes are wrapped in `try/catch` because storage can be blocked.                                                                |
| Zoneless (default)                                         | Add `zone.js`                                                | It is the Angular 21 default. Only one place (the OS theme listener) needed `markForCheck()`.                                                                                                       |
| `debugLog()` controlled by `isDevMode()`                   | Plain `console.log` everywhere                               | Logs show the lifecycle while developing (the brief asks for this) and are switched off in production builds.                                                                                       |
| `required: true` on `text`, `theme`, `readingTime`         | All inputs optional                                          | Those components cannot work without them. The booleans and `limit` have safe defaults (`false`, `null`).                                                                                           |

---

## 14. Testing and limitations

### Automated versus manual testing

There are **no automated tests** in this project: no `*.spec.ts` files and no `test`
script, and the CLI is configured with `skipTests: true`. Everything below is
**manual** testing in the browser. Automated tests (unit tests for each component's
inputs, outputs and `ngOnChanges`) are listed under next steps.

### Manual test scenarios

Run `npm start`, open http://localhost:4200/ and the DevTools Console.

| #   | Area                | Steps                                                                        | Expected                                                                                                                                                            |
| --- | ------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Typing              | Type `Hello world. Bye!`                                                     | Characters `17`, words `03`, sentences `02`, reading time `<1 minute`                                                                                               |
| 2   | Deleting            | Delete all text                                                              | All cards `00`, reading time `0 minute`, "No characters found…" message                                                                                             |
| 3   | Exclude spaces      | With the text from test 1, tick Exclude Spaces                               | Characters `15`, "(no space)" appears; words and sentences unchanged                                                                                                |
| 4   | Limit on            | Tick Set Character Limit                                                     | Field becomes enabled and focused; no warning yet                                                                                                                   |
| 5   | Over the limit      | Enter `10`, have more than 10 characters                                     | Orange border and glow; "Limit reached! Your text exceeds 10 characters."                                                                                           |
| 6   | Limit + spaces      | Text with 11 characters including 2 spaces, limit `10`, tick Exclude Spaces  | Warning disappears (9 characters counted)                                                                                                                           |
| 7   | Limit off / invalid | Untick the limit, or clear the field, or enter `0`                           | Warning disappears                                                                                                                                                  |
| 8   | Letter density      | Type `aaabbc`                                                                | A 3 (50.00%), B 2 (33.33%), C 1 (16.67%)                                                                                                                            |
| 9   | See more            | Type `the quick brown fox`, click See more, then See less                    | 5 rows → all rows → 5 rows; label and arrow change                                                                                                                  |
| 10  | See more reset      | Expand, then delete text until 5 or fewer letters remain, then type more     | The list comes back collapsed ("See more")                                                                                                                          |
| 11  | Theme               | Click the toggle, reload the page                                            | Theme switches and is still applied after reload                                                                                                                    |
| 12  | OS theme            | Clear `localStorage`, change the OS or DevTools colour-scheme emulation      | The theme and header icon follow it                                                                                                                                 |
| 13  | Responsive          | DevTools device toolbar at 375px, 768px and 1280px                           | Cards stacked below 768px, in a row from 768px; no horizontal scrolling                                                                                             |
| 14  | Keyboard            | Without the mouse: Tab through everything, use Space/Enter                   | Order: logo → theme toggle → textarea → Exclude Spaces → Set Character Limit → limit field (only when enabled) → See more (only when shown). Visible focus on each. |
| 15  | Reduced motion      | Turn on reduced motion in the OS (or emulate it in DevTools), click See more | The arrow flips without animating                                                                                                                                   |

### Testing component interaction, lifecycle hooks and change detection

The console logs show which component reacted and why:

| Action                              | Console output                                                                                                                                                                                                                                  | What it proves                                                                                                      |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Load the page                       | `[App] ngOnInit: loading theme`<br>`[TextInput] ngOnChanges: text, limit, limitEnabled, excludeSpaces`<br>`[StatsCards] ngOnChanges: text, excludeSpaces`<br>`[LetterDensity] ngOnChanges: text`<br>`[LetterDensity] ngOnInit: initial density` | Parent initialises first; each child's first `ngOnChanges` comes before its `ngOnInit`.                             |
| Type one letter                     | `[TextInput] ngOnChanges: text`<br>`[StatsCards] ngOnChanges: text`<br>`[LetterDensity] ngOnChanges: text`                                                                                                                                      | The output went up, the parent updated `text`, and only the three components that receive `text` got the new input. |
| Turn on the limit and type a number | `[TextInput] ngOnChanges: limitEnabled`, then `[TextInput] ngOnChanges: limit`                                                                                                                                                                  | Only TextInput receives these inputs, so only it reacts.                                                            |
| Tick Exclude Spaces                 | `[TextInput] ngOnChanges: excludeSpaces`<br>`[StatsCards] ngOnChanges: excludeSpaces`                                                                                                                                                           | Letter Density does not receive this input and stays quiet.                                                         |
| Click See more                      | (no log)                                                                                                                                                                                                                                        | An internal event updates the component without any input changing, so `ngOnChanges` does not run.                  |

The logs are written only in development (`isDevMode()`), so they do not appear in
`npm run build` output.

### Limitations

- **Sentences** are counted by ending punctuation. Text without `.`, `!`, `?` or `…`
  counts as 0 sentences, and `3.14` or `e.g.` count as sentence endings.
- **Words** are split on whitespace, so `well-known` is one word and `—` on its own is a word.
- **Letter density** counts only A–Z, so `é`, `ñ` and non-Latin letters are ignored.
- **Reading time** assumes 200 words per minute for every reader.
- **The text is not saved.** Reloading the page, or clicking the logo, clears it.
- **The limit field** accepts decimals (`2.5` gives "exceeds 2.5 characters") and gives
  no feedback for `0` or negative numbers.
- **No automated tests**, and no screen reader or contrast testing yet (see
  [section 4](#4-accessibility-what-is-done-and-what-still-needs-checking)).
- **No screenshots** in this README yet.

### Next steps

- Unit tests for each component: inputs → output, `ngOnChanges` results, emitted events.
- Move to signal `input()`, `output()` and `computed()` and compare with the current
  version.
- Save the text in `localStorage`.
- Accept only whole numbers ≥ 1 in the limit field, with a message.
- Test with a screen reader and reduce the live-region announcements if they are too noisy.
- Measure colour contrast in both themes.
- Add screenshots of desktop and mobile in both themes.

---

## 15. Questions I should be able to answer in my review

Each answer is based on this project. The follow-ups check whether I understand the
answer or have only memorised it.

**1. Why Angular when vanilla JavaScript already worked?**
The lab is about Angular components, so I rebuilt a problem I already understood to
focus on the Angular concepts. Vanilla JS is fine for an app this size. Angular changes
how the code is organised (components, data down/events up, lifecycle) rather than what
the app can do.
_Follow-up: "Name something that became harder in Angular."_ Focusing the limit field:
I had to wait for the next render with `afterNextRender`, because the field is enabled
through state, not directly. Another one: the `markForCheck()` bug.

**2. What does Angular actually do for this application?**
It creates the components, passes inputs and calls outputs, calls the lifecycle hooks,
and runs change detection to keep the DOM in sync with the state. It also compiles and
type-checks the templates.
_Follow-up: "What code would you have to write yourself without it?"_ Every
`textContent =`, `hidden =` and `setAttribute` update, plus deciding which ones to run
after each event, which is what `updateStats()` does in the reference.

**3. Why did you divide the app into these components?**
Each one matches one area of the design and has one responsibility. The parent holds
shared state, the children display it and report actions.
_Follow-up: "Why is `showAll` not in the parent?"_ Nothing outside Letter Density needs
it.
_"Would you split StatsCards into three card components?"_ It could be a reusable
`StatCard` with `number` and `label` inputs. I did not, because the three cards are
always shown together and the counting logic belongs together.

**4. What is the difference between a component and a directive?**
A component is a directive **with a template**: it renders its own piece of UI. A
directive adds behaviour to an existing element (attribute directive) or changes the
DOM structure (structural directive). This project has no custom directives. `@for` is
built-in control flow syntax, and `[hidden]` is a plain DOM property binding, not a
directive.
_Follow-up: "Could the hover effect be a directive?"_ Yes, an attribute directive could
add it, but CSS `:hover` is simpler and needs no JavaScript.

**5. How does `@Input()` differ from `@Output()`?**
`@Input()` receives **data** from the parent (`[text]="text"`). `@Output()` sends
**events** to the parent (`(textChange)="onTextChange($event)"`). Data goes down, events
go up.
_Follow-up: "Can a child change its own `@Input()` value?"_ Technically yes, but the
parent would not know, and the next time the parent's value changes it would overwrite
it. The child should emit instead.

**6. What is `EventEmitter`?**
The object behind an `@Output()`. It extends RxJS `Subject`. `emit(value)` calls every
listener synchronously, and the value becomes `$event` in the parent's template.
_Follow-up: "Is `emit` asynchronous?"_ No. The parent's `onTextChange` has already run
when `emit()` returns. The DOM update comes later, in change detection.

**7. What happens when I type into the textarea?**
`(input)` → `onInput()` → `textChange.emit(value)` → parent `onTextChange()` sets `text`
→ change detection checks `AppComponent`'s bindings → `[text]` changed on three children
→ their `ngOnChanges` run → their templates update the DOM. Header and Settings are
skipped (OnPush, no input changed, unless the reading time text changed).
_Follow-up: "At which step does the screen change?"_ Only during change detection, not
when `this.text` is set.

**8. What is a lifecycle hook?**
A method Angular calls at a defined moment in a component's life. I use `ngOnInit`
(App: theme setup; LetterDensity: first list), `ngOnChanges` (TextInput, StatsCards,
LetterDensity: recalculate on new inputs) and `ngOnDestroy` (App: remove the listener).
_Follow-up: "Does implementing the `OnInit` interface make the hook run?"_ No. Angular
calls the method if it exists. The interface only lets TypeScript check the method name
and signature.

**9. Why does `ngOnChanges` run before `ngOnInit`?**
Angular first sets the inputs and reports them through `ngOnChanges`. `ngOnInit` comes
next, so it can rely on the inputs already having values.
_Follow-up: "When does `ngOnChanges` not run at all?"_ When a component has no bound
inputs, like `AppComponent`, or when a bound value has not changed.

**10. Why not put everything in the constructor?**
Inputs are not set yet in the constructor, it runs only once (so it cannot react to
changes), and it has no clean-up counterpart. Angular uses the constructor for creating
the object and dependency injection.
_Follow-up: "What runs at construction time in `AppComponent`?"_ The field initialisers:
`window.matchMedia(...)` and `inject(ChangeDetectorRef)`. Neither depends on inputs.

**11. What is change detection?**
The process that compares every template binding with its last value and updates the
DOM where they differ, walking the tree from the root.
_Follow-up: "Does Angular compare the DOM?"_ No. It compares the binding **values** it
stored last time.

**12. What is re-rendering in Angular?**
Not rebuilding the component. The DOM is created once; later passes update only changed
bindings. Elements are only created or removed by control flow, such as `@for` rows with
`track item.letter`.
_Follow-up: "What does `track` do?"_ It tells Angular which row is which, so it can keep,
move or remove the right `<li>` instead of rebuilding all of them.

**13. What is `OnPush`?**
A strategy that makes Angular skip a component unless an input got a new value, one of
its own (or a child's) template events fired, it was marked with `markForCheck()`, or a
signal/`async` pipe in its template changed.
_Follow-up: "What would break if a parent mutated an object input?"_ The reference stays
the same, so an OnPush child would not update. All my inputs are primitives, so this
cannot happen.

**14. What does `markForCheck()` do?**
It marks the component and its ancestors as needing a check, and in a zoneless app it
schedules change detection. It does not run change detection immediately.
_Follow-up: "Why is it needed in `onSystemThemeChange` but not in `onThemeToggle`?"_
`onThemeToggle` runs from a template `(click)` event, which notifies Angular
automatically. The media-query listener is a plain browser listener, so Angular is not
notified.

**15. What is Zone.js?**
A library that patches browser async APIs so Angular knows when any async task has
finished and can run change detection. It does not update the DOM itself.
_Follow-up: "Is it required for Angular?"_ No. Zoneless apps are supported, and it is
the default for new Angular 21 projects.

**16. Does my application use Zone.js?**
No. It is zoneless: `zone.js` is not installed and no zone provider is configured.
Change detection is triggered by template events and `markForCheck()`.
_Follow-up: "What would change if you added Zone.js?"_ The OS theme listener would
trigger change detection automatically, so `markForCheck()` would not be needed. The
bundle would be larger, and change detection would also run after unrelated async work.

**17. What is the difference between Angular and React?**
Angular is a full framework with TypeScript classes, separate templates, decorators,
dependency injection and built-in tools. React is a UI library built around functions
that return JSX. When state changes, React re-runs the component and compares the result
(virtual DOM). Angular checks template bindings. Both use "data down, events up": inputs
and outputs in Angular, props and callbacks in React.
_Follow-up: "What is the React equivalent of `ngOnDestroy`?"_ The clean-up function
returned from `useEffect`.

**18. What are the trade-offs of using Angular?**
Pros: structure, components, typed templates, lifecycle, standard tools. Cons: setup,
build step, about 39 kB compressed of framework code versus a 5 kB script, a learning
curve, and concepts like OnPush and zoneless notification that can cause subtle bugs.
_Follow-up: "When would you not use it?"_ A small widget, a mostly static site, or a
quick prototype.

**19. What would you improve in this project?**
Unit tests, a validated whole-number limit field, saving the text, screen reader and
contrast testing, trying signal inputs, and screenshots.
_Follow-up: "How would signals change `StatsCardsComponent`?"_ `text = input.required<string>()`
and `wordCount = computed(() => countWords(this.text()))`. The value would update by
itself when `text` changes, with no `ngOnChanges`.

**20. Why is `readingTime` a getter but the counts are calculated in `ngOnChanges`?**
`readingTime` belongs to the parent, which has no inputs, so `ngOnChanges` would never
run there. A getter is the simplest way to derive it from `text`. In the children,
`ngOnChanges` avoids recalculating on every check.
_Follow-up: "What does the getter cost?"_ It runs every time `AppComponent` is checked,
which is after every event. Counting words is cheap, so that is acceptable here.

**21. Why does TextInput receive `excludeSpaces`?**
The limit must be checked against the same number the user sees on the card. If spaces
are excluded from the card but counted for the limit, the warning would contradict the
card.
_Follow-up: "Where else could the over-limit decision live?"_ In the parent, which would
pass `isOverLimit` down. I kept it in TextInput because that is the component that shows
the result, and it demonstrates `ngOnChanges` with several inputs.

---

## 16. Running the project

**Requirements:** Node.js 20.19+, 22.12+ or 24+, and npm.

```bash
npm install
npm start          # ng serve → http://localhost:4200/
```

To make a production build:

```bash
npm run build      # output in dist/character-counter/browser
```

Format the code:

```bash
npx prettier --write .
```
