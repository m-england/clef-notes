# Clef Notes — Claude Context

Clef Notes is a vocal and piano practice app. It runs entirely in the browser with no backend — all data is stored in IndexedDB on the user's device.

## Tech stack

- **Svelte 5** with TypeScript (Vite, no SvelteKit)
- **Pure CSS** — no Tailwind, no CSS frameworks. All styling uses custom properties defined in `src/app.css`.
- **IndexedDB** for persistence — no backend, no accounts, no sync.
- **Screen Wake Lock API** — prevents the device sleeping during an active exercise session.

## Navigation

Navigation is a hand-rolled stack in `src/stores/navigation.svelte.ts`. There is no router library.

- `navigate(view, params)` — pushes a new view onto the stack (forward slide animation)
- `back()` — pops the stack (back slide animation)
- `current()` — returns the top frame `{ view: ViewName, params }`
- `navDirection()` — returns `'forward'` or `'back'` for the current transition

**Important:** `current()` and `navDirection()` are plain functions, not exported `$derived` values. Call them inside `$effect` or `$derived` blocks to get reactivity. Do not export `$derived` or getter objects from `.svelte.ts` modules — Svelte 5 does not allow it.

### View names (`ViewName`)

```
'home' | 'practice' | 'exercise-list' | 'exercise-detail' | 'stats' | 'settings'
```

To add a new top-level view: add its name to `ViewName` in the navigation store, create `src/views/YourView.svelte`, and add `{:else if}` branches for it in `src/App.svelte` (both the active and leaving view blocks).

## View structure

```
src/views/
  HomeView.svelte          — Practice (large), Stats + Settings (smaller)
  PracticeView.svelte      — Piano / Voice instrument selection cards
  ExerciseListView.svelte  — Exercise list sorted by play count (most → least)
  ExerciseDetailView.svelte — Description, last session info, Start button
  StatsView.svelte          — Placeholder
  SettingsView.svelte       — Placeholder
```

Every sub-view (everything except Home) must include a back button in the top-left. Use `<BackArrow />` from `src/lib/ui/BackArrow.svelte` unless the view needs to intercept the back action (e.g. to release the wake lock), in which case replicate the button's style and call `back()` manually after cleanup.

The view container must be `position: relative` for the `BackArrow` absolute positioning to work.

## Data layer

### IndexedDB — `clef-notes-db` (version 1)

Three object stores:

| Store | Key | Purpose |
|---|---|---|
| `instruments` | `id` ('piano' \| 'voice') | Last practiced timestamp |
| `exercises` | `id` (slug string) | Play count, last played timestamp |
| `sessions` | `id` (UUID) | Per-session history and results |

Raw CRUD lives in `src/lib/db/idb.ts`. Never call IndexedDB directly from components — go through the store.

### Reactive DB store — `src/stores/db.svelte.ts`

```ts
dbState.instruments         // InstrumentRecord[]
dbState.exercisesByInstrument  // Record<'piano'|'voice', ExerciseRecord[]>
dbState.ready               // boolean — true once initDB() has completed

incrementPlayCount(exerciseId, instrumentId)  // updates count + lastPracticed, refreshes state
getLastSession(exerciseId)                    // returns most recent SessionRecord or null
```

`initDB()` is called once in `App.svelte`'s `onMount`. It opens the DB and seeds it if empty.

## Exercise registry

Static exercise definitions (title, description, category) live in `src/lib/exercises/registry.ts`. Dynamic data (play counts, history) lives in IndexedDB. The two are joined by a stable `id` slug.

```ts
interface ExerciseDefinition {
  id: string           // stable slug — must match the IndexedDB key
  instrumentId: 'piano' | 'voice'
  title: string
  description: string
  category: string
  // Future: component?: Component  ← add this when implementing real exercise logic
}
```

**To add a new exercise:** add an entry to `src/lib/exercises/piano/index.ts` or `src/lib/exercises/voice/index.ts`. The exercise will be seeded into IndexedDB automatically on the next fresh DB creation. If the DB already exists on a user's device, you will need a DB version bump and an `onupgradeneeded` migration to insert the new record.

**To implement a real exercise:** add a `component` field to `ExerciseDefinition` pointing to a Svelte component. Update `ExerciseDetailView` to render it when present. The Start button in `ExerciseDetailView` already calls `incrementPlayCount` and `acquireWakeLock` — hook the exercise component lifecycle into `releaseWakeLock` when the exercise ends.

## Wake lock

`src/lib/wakeLock.ts` exports `acquireWakeLock()` and `releaseWakeLock()`. The lock is acquired when Start is pressed and released when the user navigates back. The `visibilitychange` listener re-acquires it automatically if the user switches tabs and returns. Gracefully no-ops on browsers that don't support the API.

## CSS conventions

- All color, spacing, and typography values come from custom properties in `src/app.css`. Never hardcode values that have a token.
- Component `<style>` blocks are scoped and use `var(--...)` tokens only.
- Global button classes: `.btn`, `.btn-primary`, `.btn-secondary` — defined in `app.css`, use them directly.
- Slide transition classes (`enter-forward`, `leave-forward`, `enter-back`, `leave-back`) are global and applied by `App.svelte` during view transitions — do not define them in components.
- `html`, `body`, and `#app` are all `height: 100%; overflow: hidden` — views fill the full viewport. Each view is responsible for its own internal scroll if needed (`overflow-y: auto` on the view root).

## DB version upgrades

The current DB version is `1`. If you add new object stores or indexes, increment `DB_VERSION` in `src/lib/db/idb.ts` and add a new `if (event.oldVersion < N)` block inside `onupgradeneeded`. Never drop or recreate existing stores in an upgrade — only add.
