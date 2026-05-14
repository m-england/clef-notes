# Plan: Staff Notation for Major Scales

**Scope:** Major Scales exercise only — renders a grand staff (treble + bass) for the current key using VexFlow 5 + Tonal.

---

## What this builds

A `<GrandStaff>` Svelte component that accepts a key name (e.g. `'C'`) and renders the ascending scale for both hands using VexFlow's SVG backend. It mounts inside `MajorScalesExercise` and redraws instantly when the key changes.

---

## Note ranges

| Clef | Range |
|---|---|
| Treble | C4 – C5 (8 notes ascending) |
| Bass | C3 – C4 (8 notes ascending) |

Tonal call:
```ts
import { Scale } from 'tonal'
Scale.rangeOf(`${key} major`)(`${key}4`, `${key}5`)  // treble
Scale.rangeOf(`${key} major`)(`${key}3`, `${key}4`)  // bass
```

---

## Pitch format conversion (Tonal → VexFlow)

VexFlow `StaveNote` keys use `'c/4'` format (lowercase, slash before octave).

```ts
function toVexKey(tonalNote: string): string {
  // 'C4' → 'c/4', 'F#4' → 'f#/4', 'Bb4' → 'bb/4'
  const match = tonalNote.match(/^([A-Ga-g][b#]?)(\d)$/)
  if (!match) throw new Error(`Invalid note: ${tonalNote}`)
  return `${match[1].toLowerCase()}/${match[2]}`
}
```

---

## Key signature names

VexFlow's `addKeySignature` uses `'C'`, `'G'`, `'D'` etc. for sharps and `'F'`, `'Bb'`, `'Eb'` etc. for flats. The circle-of-fifths keys already use these names — `'F#'` and `'Db'` need special handling:

| Circle of fifths key | VexFlow key sig |
|---|---|
| F# | F# |
| Db | Db |
| All others | as-is |

VexFlow accepts these directly — no mapping needed.

---

## New file: `src/lib/ui/GrandStaff.svelte`

### Props
```ts
let { musicalKey }: { musicalKey: string } = $props()
```

### Approach

Use the low-level `Renderer` / `Stave` / `StaveNote` / `Formatter` API directly (not EasyScore). EasyScore's key signature support is under-documented in v5; the direct API is explicit and reliable.

### Layout constants
```ts
const WIDTH = 560        // SVG total width
const STAVE_WIDTH = 480  // actual stave width (leaves margin)
const STAVE_X = 10       // left offset
const TREBLE_Y = 20
const BASS_Y = 120       // enough space below treble stave
const HEIGHT = 230       // total SVG height
```

### Rendering function (called on mount and on key change)

```ts
function render(container: HTMLElement, key: string) {
  container.innerHTML = ''  // clear previous render

  const renderer = new Renderer(container, Renderer.Backends.SVG)
  renderer.resize(WIDTH, HEIGHT)
  const ctx = renderer.getContext()

  // SVG colour override — VexFlow defaults to black, match the app theme
  ctx.setFillStyle('#e8e8f0')
  ctx.setStrokeStyle('#e8e8f0')

  // --- Treble stave ---
  const trebleStave = new Stave(STAVE_X, TREBLE_Y, STAVE_WIDTH)
  trebleStave.addClef('treble').addKeySignature(key)
  trebleStave.setContext(ctx).draw()

  // --- Bass stave ---
  const bassStave = new Stave(STAVE_X, BASS_Y, STAVE_WIDTH)
  bassStave.addClef('bass').addKeySignature(key)
  bassStave.setContext(ctx).draw()

  // --- Notes ---
  const trebleNotes = buildNotes('treble', key, 4)
  const bassNotes   = buildNotes('bass',   key, 3)

  const trebleVoice = new Voice({ numBeats: 4, beatValue: 4 })
    .setMode(Voice.Mode.SOFT)   // don't error if note count != beats
    .addTickables(trebleNotes)

  const bassVoice = new Voice({ numBeats: 4, beatValue: 4 })
    .setMode(Voice.Mode.SOFT)
    .addTickables(bassNotes)

  new Formatter()
    .joinVoices([trebleVoice])
    .joinVoices([bassVoice])
    .format([trebleVoice, bassVoice], STAVE_WIDTH - 60)

  trebleVoice.draw(ctx, trebleStave)
  bassVoice.draw(ctx, bassStave)

  // Beam in groups of 4
  Beam.generateBeams(trebleNotes).forEach(b => b.setContext(ctx).draw())
  Beam.generateBeams(bassNotes).forEach(b => b.setContext(ctx).draw())
}
```

### `buildNotes(clef, key, startOctave)` helper

```ts
function buildNotes(clef: string, key: string, startOctave: number): StaveNote[] {
  const root = `${key}${startOctave}`
  const top  = `${key}${startOctave + 1}`
  const tonalNotes = Scale.rangeOf(`${key} major`)(root, top)

  return tonalNotes.map(n => {
    const vexKey = toVexKey(n)
    const note = new StaveNote({ clef, keys: [vexKey], duration: '8' })
    // Add accidental modifier if the key contains one
    if (n.includes('#')) Accidental.applyAccidentals([note], key)  // let VexFlow decide
    return note
  })
}
```

> **Note on accidentals:** VexFlow's `Accidental.applyAccidentals(notes, keySignature)` automatically adds accidental glyphs only where needed given the key signature — so notes that are already in the key sig don't get redundant sharps/flats. Call it per-stave after building the notes array.

Revised `buildNotes` using `applyAccidentals` correctly (it takes the full voice's notes array, not per-note):

```ts
function buildNotes(clef: string, key: string, startOctave: number): StaveNote[] {
  const root = `${key}${startOctave}`
  const top  = `${key}${startOctave + 1}`
  const tonalNotes = Scale.rangeOf(`${key} major`)(root, top)

  const notes = tonalNotes.map(n =>
    new StaveNote({ clef, keys: [toVexKey(n)], duration: '8' })
  )
  Accidental.applyAccidentals(notes, key)
  return notes
}
```

### Reactive redraw with `$effect`

```svelte
<script lang="ts">
  import { onMount } from 'svelte'
  import { Renderer, Stave, StaveNote, Formatter, Voice, Beam, Accidental } from 'vexflow'
  import { Scale } from 'tonal'

  let { musicalKey }: { musicalKey: string } = $props()

  let container: HTMLDivElement

  $effect(() => {
    const key = musicalKey   // track reactively
    if (container) render(container, key)
  })
</script>

<div bind:this={container} class="staff-container"></div>
```

`$effect` re-runs whenever `musicalKey` changes, clearing and redrawing the SVG. No `onMount` needed — `$effect` fires after mount too.

### Styles

```css
.staff-container {
  width: 100%;
  overflow-x: auto;  /* scroll on narrow screens rather than clipping */
}

/* Override VexFlow SVG defaults to match dark theme */
.staff-container :global(svg) {
  display: block;
  max-width: 100%;
}

.staff-container :global(svg path),
.staff-container :global(svg rect),
.staff-container :global(svg text) {
  fill: var(--color-text);
  stroke: var(--color-text);
}
```

---

## Changes to `MajorScalesExercise.svelte`

Import and render `<GrandStaff>` above the key display, passing `keys[currentIndex]`:

```svelte
<GrandStaff musicalKey={keys[currentIndex]} />
```

The existing layout (progress, key display, timer, buttons) stays below it.

---

## Files touched

| File | Change |
|---|---|
| `src/lib/ui/GrandStaff.svelte` | **New** — grand staff renderer using VexFlow + Tonal |
| `src/lib/exercises/piano/MajorScalesExercise.svelte` | Import and render `<GrandStaff>` |

No changes to the data layer, registry, or `ExerciseDetailView`.

---

## Known risks / things to verify during implementation

1. **VexFlow SVG colour** — VexFlow renders black by default. `ctx.setFillStyle` / `ctx.setStrokeStyle` may or may not cascade to all child elements depending on v5's internals. CSS `:global` overrides on `path`/`rect`/`text` are the reliable fallback.
2. **`Scale.rangeOf` with enharmonic keys** — `Db major` and `C# major` are enharmonic. Tonal uses `Db` by default for the flat spelling. VexFlow also uses `Db` as a key signature name. Should be consistent, but worth a quick smoke-test on `F#` and `Db`.
3. **Voice.Mode.SOFT** — 8 eighth notes = 4 beats, which fits 4/4 exactly. `SOFT` mode is still good practice to avoid hard errors if Tonal ever returns 7 notes instead of 8 for an edge case.
4. **Beaming** — `Beam.generateBeams` with eighth notes will beam all 8 notes as one group or two groups of 4 depending on VexFlow's default beam groups. May want to manually split into two groups of 4 for cleaner readability: `[trebleNotes.slice(0,4), trebleNotes.slice(4)]`.
