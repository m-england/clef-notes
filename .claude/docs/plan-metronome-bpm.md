# Plan: BPM Slider + Metronome

**Scope:** Major Scales exercise only (but metronome logic is isolated for reuse).  
**Depends on:** Major Scales exercise (already implemented).

---

## UX summary

- BPM slider lives on `ExerciseDetailView`, shown only when `def.component` is present (i.e. exercises that have a real implementation).
- Range: 40–208. Default: 80. Pre-filled from `lastSession.results.bpm` if present.
- Pressing **Start** passes the chosen BPM into the exercise component as a prop.
- Inside `MajorScalesExercise`, the metronome starts immediately and runs until the component is destroyed.
- Metronome: 4/4, synthesised via Web Audio API. Beat 1 is a higher-pitched click; beats 2–4 are lower.
- `bpm` is saved in session results alongside the existing fields.

---

## New file: `src/lib/metronome.ts`

Isolated Web Audio metronome — no Svelte dependency, reusable by any future exercise.

```ts
export interface MetronomeOptions {
  bpm: number
}

export interface Metronome {
  start(): void
  stop(): void
  setBpm(bpm: number): void
}
```

### Implementation approach

Use the **scheduler pattern**: a `setInterval` fires every ~25ms and schedules Web Audio clicks up to 100ms ahead. This avoids drift from `setInterval` jitter by scheduling audio events on the `AudioContext` clock rather than firing sounds directly from the interval.

**State:**
```ts
let audioCtx: AudioContext | null = null
let nextBeatTime = 0       // AudioContext timestamp of the next scheduled beat
let beatIndex = 0          // 0–3 for 4/4
let intervalId: ReturnType<typeof setInterval> | null = null
let currentBpm = 80
```

**`scheduleClick(time, isDownbeat)`**  
Creates a short oscillator burst:
- Downbeat (beat 1): frequency 1000 Hz, duration 30ms
- Other beats: frequency 600 Hz, duration 20ms
- Gain envelope: ramp up to 0.7 in 1ms, ramp down to 0 over the remaining duration

```ts
function scheduleClick(time: number, isDownbeat: boolean) {
  const osc = audioCtx!.createOscillator()
  const gain = audioCtx!.createGain()
  osc.connect(gain)
  gain.connect(audioCtx!.destination)

  osc.frequency.value = isDownbeat ? 1000 : 600
  gain.gain.setValueAtTime(0, time)
  gain.gain.linearRampToValueAtTime(0.7, time + 0.001)
  gain.gain.linearRampToValueAtTime(0, time + (isDownbeat ? 0.03 : 0.02))

  osc.start(time)
  osc.stop(time + 0.05)
}
```

**`scheduler()` — called every 25ms by the interval**  
While `nextBeatTime < audioCtx.currentTime + 0.1`:
- Call `scheduleClick(nextBeatTime, beatIndex === 0)`
- Advance `nextBeatTime += 60 / currentBpm`
- Advance `beatIndex = (beatIndex + 1) % 4`

**`start()`**
```ts
audioCtx = new AudioContext()
nextBeatTime = audioCtx.currentTime
beatIndex = 0
intervalId = setInterval(scheduler, 25)
```

**`stop()`**
```ts
clearInterval(intervalId)
audioCtx?.close()
audioCtx = null
```

**`setBpm(bpm)`**  
Just updates `currentBpm`. The scheduler picks it up on the next interval tick — no restart needed.

**Export:**
```ts
export function createMetronome(options: MetronomeOptions): Metronome {
  currentBpm = options.bpm
  return { start, stop, setBpm }
}
```

---

## Changes to `ExerciseDetailView.svelte`

### New state (stub UI only, before Start)

```ts
const DEFAULT_BPM = 80
let bpm = $state(DEFAULT_BPM)
```

### Derive initial BPM from last session

In the existing `$effect` that fetches `lastSession`, set `bpm` from results if present:

```ts
$effect(() => {
  const id = exerciseId
  getLastSession(id).then(s => {
    lastSession = s
    if (typeof s?.results?.bpm === 'number') {
      bpm = s.results.bpm
    }
  })
})
```

### Pass BPM to the exercise component

Add `bpm` to `ExerciseComponentProps` in `registry.ts`, and pass it when rendering:

```svelte
<ExerciseComponent
  sessionId={activeSessionId ?? ''}
  bpm={bpm}
  onComplete={handleComplete}
/>
```

### Slider UI

Add between the description and the last-session card — but only when `def.component` is defined (exercises that have real logic):

```svelte
{#if def.component}
  <div class="tempo-control">
    <div class="tempo-header">
      <span class="section-label">Tempo</span>
      <span class="bpm-value">{bpm} BPM</span>
    </div>
    <input
      type="range"
      class="bpm-slider"
      min="40"
      max="208"
      step="1"
      bind:value={bpm}
    />
  </div>
{/if}
```

### Slider CSS (scoped to `ExerciseDetailView`)

```css
.tempo-control {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.tempo-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.bpm-value {
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--color-accent);
}

.bpm-slider {
  width: 100%;
  accent-color: var(--color-accent);
  cursor: pointer;
}
```

---

## Changes to `registry.ts`

Add `bpm` to `ExerciseComponentProps`:

```ts
export interface ExerciseComponentProps {
  sessionId: string
  bpm: number
  onComplete: (results: Record<string, unknown>) => void
}
```

---

## Changes to `MajorScalesExercise.svelte`

### Props

```ts
let { sessionId, bpm, onComplete }: {
  sessionId: string
  bpm: number
  onComplete: (results: Record<string, unknown>) => void
} = $props()
```

### Metronome lifecycle

```ts
import { createMetronome } from '../metronome'

const metronome = createMetronome({ bpm })

onMount(() => {
  metronome.start()
  const timerId = setInterval(() => { elapsedSeconds++ }, 1000)
  return () => {
    metronome.stop()
    clearInterval(timerId)
  }
})
```

### Save BPM in results

```ts
function finish() {
  const totalSeconds = Math.round((Date.now() - sessionStartTime) / 1000)
  onComplete({ bpm, totalSeconds, keysCompleted: [...keysCompleted], timePerKey })
}
```

---

## Changes to `ExerciseDetailView` last-session card

Show BPM alongside duration:

```svelte
{#if lastSession.results?.totalSeconds != null}
  <span class="session-duration">
    {Math.floor((lastSession.results.totalSeconds as number) / 60)}m
    {(lastSession.results.totalSeconds as number) % 60}s
    {#if lastSession.results.bpm != null}
      · {lastSession.results.bpm} BPM
    {/if}
  </span>
{/if}
```

---

## Files touched

| File | Change |
|---|---|
| `src/lib/metronome.ts` | **New** — scheduler-based Web Audio metronome |
| `src/lib/exercises/registry.ts` | Add `bpm: number` to `ExerciseComponentProps` |
| `src/views/ExerciseDetailView.svelte` | BPM state, slider UI, pass `bpm` prop, show BPM in last-session card |
| `src/lib/exercises/piano/MajorScalesExercise.svelte` | Accept `bpm` prop, start/stop metronome, save BPM in results |

No DB changes. No new stores. No version bump.

---

## Notes

- `AudioContext` is created inside `start()`, not at module level — browsers block audio contexts that are created before a user gesture. `start()` is called from `onMount`, which fires after the user has already pressed **Start**, so the gesture requirement is satisfied.
- `setBpm` is on the `Metronome` interface for future use (e.g. if the slider moves to inside the exercise). It's not wired to anything in this plan since the slider is on the detail page and locked in at Start.
