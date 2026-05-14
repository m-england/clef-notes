# Plan: Major Scales Exercise (Piano)

**Exercise ID:** `piano-major-scales`  
**Feature area:** Real Exercises (first implementation)

---

## What this builds

An interactive exercise component that replaces the stub UI when `piano-major-scales` is active. The user sees the current key and a running timer. They press **Next Key** to advance through all 12 major keys (circle of fifths order, starting at a random offset each session). Pressing **Finish** (or completing all 12) ends the session and writes results.

---

## UX flow

1. User presses **Start** on `ExerciseDetailView` — `exerciseActive` becomes true, the component mounts.
2. Component shows: current key name (large), elapsed timer, key position (e.g. "3 / 12"), **Next Key** button, and **Finish** button.
3. Each **Next Key** press records time spent on the current key and advances the index.
4. After the 12th key, **Next Key** is replaced by **Finish** (or auto-advances to the finish step).
5. **Finish** (at any point) calls `onComplete(results)` — a callback prop — which the parent (`ExerciseDetailView`) uses to close the session and reset state.
6. The back arrow in `ExerciseDetailView` still works at any time: it calls `closeSession` with whatever partial results have accumulated (the existing `handleBack` logic is unchanged for this).

---

## Key order

Circle of fifths: `C G D A E B F# Db Ab Eb Bb F`

At exercise start, pick a random index `n` in `[0, 11]`. The sequence displayed is the 12 keys starting from index `n` (wrapping around). Example: starting at index 3 = `A E B F# Db Ab Eb Bb F C G D`.

This means every session covers all 12 keys exactly once, but in a different starting position each time.

---

## Session results shape

```ts
interface MajorScalesResults {
  totalSeconds: number         // wall-clock duration of the session
  keysCompleted: string[]      // keys the user tapped through, in order (subset if finished early)
  timePerKey: Record<string, number>  // seconds spent on each completed key
}
```

This is compatible with `SessionResults` (`{ [key: string]: unknown }`) — no schema change needed.

---

## Files to change

| File | What changes |
|---|---|
| `src/lib/exercises/registry.ts` | Add `component` field to `ExerciseDefinition` |
| `src/lib/exercises/piano/index.ts` | Wire `component` on `piano-major-scales` entry |
| `src/views/ExerciseDetailView.svelte` | Render component when `def.component` is present; pass props; handle `onComplete` |
| `src/lib/exercises/piano/MajorScalesExercise.svelte` | **New file** — the exercise component |

No DB changes. No new stores. No version bump.

---

## Step 1 — Add `component` to `ExerciseDefinition` in `registry.ts`

```ts
import type { Component } from 'svelte'

export interface ExerciseDefinition {
  id: string
  instrumentId: 'piano' | 'voice'
  title: string
  description: string
  category: string
  component?: Component<ExerciseComponentProps>  // absent = stub UI
}

export interface ExerciseComponentProps {
  sessionId: string
  onComplete: (results: Record<string, unknown>) => void
}
```

`ExerciseComponentProps` is defined here (not in schema.ts) because it's a UI contract, not a DB concern. The `component` field is optional so all existing exercise stubs continue to work without changes.

---

## Step 2 — Wire the component in `piano/index.ts`

```ts
import MajorScalesExercise from './MajorScalesExercise.svelte'

// on the piano-major-scales entry:
{
  id: 'piano-major-scales',
  instrumentId: 'piano',
  title: 'Major Scales',
  description: '...',
  category: 'Scales',
  component: MajorScalesExercise,
}
```

All other entries remain unchanged (no `component` field = stub UI).

---

## Step 3 — Update `ExerciseDetailView.svelte`

### Import change

```ts
import type { ExerciseComponentProps } from '../lib/exercises/registry'
```

### Template change

Replace the current **Start** button block with a conditional:

```svelte
{#if exerciseActive && def.component}
  <svelte:component
    this={def.component}
    sessionId={activeSessionId ?? ''}
    onComplete={handleComplete}
  />
{:else}
  <p class="description">{def.description}</p>
  <div class="last-session">...</div>
  <button class="btn btn-primary start-btn" onclick={handleStart}>Start</button>
{/if}
```

When the exercise is active and a component exists, the component fills the content area. The back arrow (`handleBack`) remains visible and functional at all times — it's outside the conditional.

### New `handleComplete` function

```ts
async function handleComplete(results: Record<string, unknown>) {
  if (activeSessionId) {
    await closeSession(activeSessionId, results)
    activeSessionId = null
  }
  await releaseWakeLock()
  exerciseActive = false
  // Refresh lastSession so the updated record shows immediately on return to stub UI
  lastSession = await getLastSession(exerciseId)
}
```

This is the clean-exit path. `handleBack` remains the abort path (closes session with `null` results), unchanged from the session recording implementation.

---

## Step 4 — `src/lib/exercises/piano/MajorScalesExercise.svelte` (new file)

### Props

```ts
let { sessionId, onComplete }: { sessionId: string; onComplete: (results: Record<string, unknown>) => void } = $props()
```

### State

```ts
const CIRCLE_OF_FIFTHS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F']

// Randomise starting position once on mount
const startOffset = Math.floor(Math.random() * 12)
const keys = [...CIRCLE_OF_FIFTHS.slice(startOffset), ...CIRCLE_OF_FIFTHS.slice(0, startOffset)]

let currentIndex = $state(0)
let elapsedSeconds = $state(0)
let keyStartTime = $state(Date.now())
let sessionStartTime = Date.now()
let timePerKey: Record<string, number> = {}
let keysCompleted: string[] = $state([])

let timerId: ReturnType<typeof setInterval> | null = null
```

### Timer

Start a 1-second interval on mount (`onMount`), increment `elapsedSeconds`. Clear it on `onDestroy` (Svelte 5: use the return value of `$effect` for cleanup, or `onDestroy`).

```ts
onMount(() => {
  timerId = setInterval(() => { elapsedSeconds++ }, 1000)
  return () => { if (timerId) clearInterval(timerId) }
})
```

### `handleNextKey`

```ts
function handleNextKey() {
  const key = keys[currentIndex]
  const spent = Math.round((Date.now() - keyStartTime) / 1000)
  timePerKey[key] = spent
  keysCompleted = [...keysCompleted, key]
  keyStartTime = Date.now()

  if (currentIndex === 11) {
    finish()
  } else {
    currentIndex++
  }
}
```

When on the last key, pressing Next Key finishes automatically (no separate Finish click needed after the final key).

### `handleFinish` (early exit)

```ts
function handleFinish() {
  // Record time on the current key even if not "completed" via Next
  const key = keys[currentIndex]
  const spent = Math.round((Date.now() - keyStartTime) / 1000)
  timePerKey[key] = spent
  // Don't push to keysCompleted — user bailed before pressing Next
  finish()
}
```

### `finish`

```ts
function finish() {
  if (timerId) clearInterval(timerId)
  const totalSeconds = Math.round((Date.now() - sessionStartTime) / 1000)
  onComplete({ totalSeconds, keysCompleted, timePerKey })
}
```

### UI layout

```
┌─────────────────────────────────────┐
│  [back arrow — from ExerciseDetail] │
│                                     │
│          Key  3 / 12                │
│                                     │
│              A                      │  ← large, accent colour
│                                     │
│          0:32  elapsed              │
│                                     │
│       [ Next Key → ]                │  ← btn-primary, disabled on last key if using separate Finish
│                                     │
│       [ Finish ]                    │  ← btn-secondary, always visible
└─────────────────────────────────────┘
```

After the 12th key is completed via **Next Key**, `finish()` fires automatically — no need for a separate Finish press.

**Finish** (btn-secondary) is always visible as an early-exit, records time on the current key in `timePerKey` but does not add it to `keysCompleted`.

### Display of elapsed time

Format as `M:SS` — e.g. 92 seconds → `1:32`.

```ts
function formatTime(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
```

---

## What the last-session card will show (after this is done)

`ExerciseDetailView` currently renders `lastSession.results` as a raw JSON `<pre>`. That's fine as a placeholder while we only have one exercise. A polish pass (separate task) can format `MajorScalesResults` into a readable summary — keys covered, time, etc.

---

## Future hook-in for other exercises

Any new exercise component just needs to accept `{ sessionId, onComplete }` and call `onComplete(results)` when done. No changes to `ExerciseDetailView` — the `svelte:component` dispatch handles it.
