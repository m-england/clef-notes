# Clef Notes — Practice App Implementation Plan

## Context

Transform a freshly scaffolded Svelte 5 + Vite app into a vocal/piano practice app with a video game menu aesthetic. No SvelteKit, no Tailwind, no backend. Navigation is pure component-based view swapping via a Svelte store. Data persists in IndexedDB. The goal of this phase is to build the full navigation shell and data layer — actual exercise logic is stubbed and will be added later.

---

## File Structure

### Delete
- `src/lib/Counter.svelte`
- `src/assets/svelte.svg`, `vite.svg`, `hero.png`

### Modify
- `src/app.css` — full replacement with dark-theme design system
- `src/App.svelte` — full replacement with view orchestrator + transition engine
- `index.html` — update `<title>` to "Clef Notes"

### Create
```
src/
├── stores/
│   ├── navigation.svelte.ts       ← view stack, navigate(), back(), direction
│   └── db.svelte.ts               ← reactive IndexedDB wrapper
├── lib/
│   ├── db/
│   │   ├── schema.ts              ← TypeScript types only
│   │   └── idb.ts                 ← openDB(), CRUD helpers, seed logic
│   ├── exercises/
│   │   ├── registry.ts            ← ExerciseDefinition type, ALL_EXERCISES, helpers
│   │   ├── piano/index.ts         ← 5 piano exercise stubs
│   │   └── voice/index.ts         ← 5 voice exercise stubs
│   └── ui/
│       └── BackArrow.svelte       ← shared back button (top-left, absolute)
└── views/
    ├── HomeView.svelte
    ├── PracticeView.svelte
    ├── ExerciseListView.svelte
    └── ExerciseDetailView.svelte
```

---

## Navigation Store (`navigation.svelte.ts`)

Svelte 5 module-level `$state`. Views never receive props — they read params from the store.

```ts
type ViewName = 'home' | 'practice' | 'exercise-list' | 'exercise-detail'
type NavFrame = { view: ViewName; params: Record<string, unknown> }

let stack: NavFrame[] = $state([{ view: 'home', params: {} }])
let direction: 'forward' | 'back' = $state('forward')
const current = $derived(stack[stack.length - 1])

function navigate(view: ViewName, params?: Record<string, unknown>): void
function back(): void
```

---

## IndexedDB Schema

**DB name:** `clef-notes-db`  **Version:** `1`

| Store | keyPath | Indexes |
|---|---|---|
| `instruments` | `id` ('piano' \| 'voice') | — |
| `exercises` | `id` (slug) | `instrumentId` |
| `sessions` | `id` (UUID) | `exerciseId`, `instrumentId` |

**`InstrumentRecord`:** `{ id, label, lastPracticedAt: number | null }`  
**`ExerciseRecord`:** `{ id, instrumentId, playCount, lastPlayedAt: number | null }`  
**`SessionRecord`:** `{ id, exerciseId, instrumentId, startedAt, completedAt: number | null, results: unknown }`

On DB creation (v1 upgrade): seed both instruments + all exercises from the registry.

Key `idb.ts` functions: `openDB`, `getAllInstruments`, `getExercisesByInstrument`, `upsertExercise`, `addSession`, `getLastSessionForExercise`, `incrementPlayCount`, `updateInstrumentLastPracticed`

---

## Exercise Registry

Static data only. Dynamic data (counts, history) lives in IndexedDB.

```ts
interface ExerciseDefinition {
  id: string           // stable slug — PK in IndexedDB
  instrumentId: 'piano' | 'voice'
  title: string
  description: string  // shown on Exercise Detail screen
  category: string
  // Future: component?: Component
}
```

Stub exercises (5 piano, 5 voice):
- **Piano:** Major Scales, Natural Minor Scales, Major Arpeggios, Chord Inversions, Sight Reading
- **Voice:** Lip Trills, Five-Note Scale, Octave Slides, Messa di Voce, Staccato Exercise

---

## CSS Architecture

### Design tokens (in `app.css`)
```css
--color-bg: #0a0a0f
--color-surface: #12121a
--color-surface-raised: #1c1c28
--color-border: #2a2a3d
--color-text: #e8e8f0
--color-text-muted: #7070a0
--color-accent: #7c6af5       /* purple */
--color-accent-glow: rgba(124,106,245,0.4)
--color-success: #4ade80
--color-danger: #f87171
```

`app.css` also defines: hard reset, `html/body/#app { height: 100%; overflow: hidden }`, global `@keyframes` for slide transitions, `.btn` / `.btn-primary` / `.btn-secondary` base classes, typographic scale vars.

Component `<style>` blocks use `var(--...)` tokens. No duplication of global rules.

---

## View Transitions

`App.svelte` maintains `activeView` and `leavingView` state. On navigation:
1. Current view → `leavingView` (gets exit animation class)
2. New view → `activeView` (gets enter animation class)
3. After 320ms, `leavingView` is cleared

CSS: `.view-wrapper { position: absolute; inset: 0; }` inside `.viewport { position: relative; overflow: hidden; }`

```
Forward: new view slides in from right, old slides out to left
Back:    new view slides in from left, old slides out to right
```

Four keyframes in `app.css`: `slide-in-right`, `slide-out-left`, `slide-in-left`, `slide-out-right`

---

## View Designs

### HomeView
- App title "Clef Notes" large + bold
- "Practice" button — largest, `.btn-primary` with accent glow on hover
- "Settings" + "Stats" — smaller, `.btn-secondary`, side by side below
- Layout: full-screen centered flex column

### PracticeView
- Two large instrument cards (Piano / Voice)
- Each: icon (unicode), name, "Last practiced: X days ago" or "Never"
- Back arrow top-left

### ExerciseListView
- Receives `params.instrumentId`
- List items: title, category badge, play count ("Played N times" / "Never played")
- Sorted by `playCount` desc (from DB store, joined with registry)
- Back arrow top-left

### ExerciseDetailView
- Receives `params.exerciseId`
- Shows: title, description (from registry), last session date + results (from DB), or "No previous sessions"
- "Start" button — calls `incrementPlayCount` but otherwise no-op for now
- Back arrow top-left

---

## Implementation Order

1. **Clean slate + global styles** — delete scaffold, replace `app.css`, stub `App.svelte` to show dark background with title
2. **Navigation store** — `navigation.svelte.ts`, verify TypeScript compiles
3. **DB schema + raw IDB helpers** — `schema.ts`, `idb.ts`, TypeScript only
4. **Exercise registry** — static data files, no Svelte
5. **DB store** — `db.svelte.ts`, wire `openDB()` + seed, verify in browser DevTools
6. **BackArrow component** — `BackArrow.svelte`, absolute top-left, calls `back()`
7. **HomeView** — three buttons, wire Practice → `navigate('practice')`
8. **App.svelte orchestrator** — transition engine, verify Home ↔ Practice slide animations
9. **PracticeView** — two instrument cards with last-practiced data
10. **ExerciseListView** — sorted list, joined with registry
11. **ExerciseDetailView** — static info + last session + stubbed Start button
12. **Polish pass** — spacing, hover states, transition smoothness, DevTools DB verification

---

## Verification

- Open app: dark background, "Clef Notes" title, three buttons visible
- Click Practice: slides in full-screen, shows Piano and Voice cards
- Select instrument: exercise list appears sorted by play count (all zero initially)
- Select exercise: detail screen shows description, "No previous sessions", Start button present
- Back arrows at every level restore the correct view
- Browser DevTools → Application → IndexedDB → `clef-notes-db`: all three stores populated on first load
- Clicking Start increments `playCount` in IndexedDB (verify in DevTools)
