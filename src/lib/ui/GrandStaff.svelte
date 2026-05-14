<script lang="ts">
  import { Renderer, Stave, StaveNote, Formatter, Voice, Beam, Accidental } from 'vexflow'
  import { Scale } from 'tonal'

  let { musicalKey }: { musicalKey: string } = $props()

  let container: HTMLDivElement = $state() as HTMLDivElement

  const WIDTH = 560
  const STAVE_WIDTH = 500
  const STAVE_X = 10
  const TREBLE_Y = 20
  const BASS_Y = 130
  const HEIGHT = 240

  function toVexKey(tonalNote: string): string {
    const match = tonalNote.match(/^([A-Ga-g][b#]?)(\d)$/)
    if (!match) throw new Error(`Invalid note: ${tonalNote}`)
    return `${match[1].toLowerCase()}/${match[2]}`
  }

  function buildNotes(clef: string, key: string, startOctave: number): StaveNote[] {
    const root = `${key}${startOctave}`
    const top = `${key}${startOctave + 1}`
    const tonalNotes = Scale.rangeOf(`${key} major`)(root, top).filter((n): n is string => n !== undefined)
    return tonalNotes.map(n =>
      new StaveNote({ clef, keys: [toVexKey(n)], duration: '8' })
    )
  }

  function render(el: HTMLDivElement, key: string) {
    el.innerHTML = ''

    const renderer = new Renderer(el, Renderer.Backends.SVG)
    renderer.resize(WIDTH, HEIGHT)
    const ctx = renderer.getContext()

    const trebleStave = new Stave(STAVE_X, TREBLE_Y, STAVE_WIDTH)
    trebleStave.addClef('treble').addKeySignature(key)
    trebleStave.setContext(ctx).draw()

    const bassStave = new Stave(STAVE_X, BASS_Y, STAVE_WIDTH)
    bassStave.addClef('bass').addKeySignature(key)
    bassStave.setContext(ctx).draw()

    const trebleNotes = buildNotes('treble', key, 4)
    const bassNotes = buildNotes('bass', key, 3)

    const trebleVoice = new Voice({ numBeats: 8, beatValue: 8 })
      .setMode(Voice.Mode.SOFT)
      .addTickables(trebleNotes)

    const bassVoice = new Voice({ numBeats: 8, beatValue: 8 })
      .setMode(Voice.Mode.SOFT)
      .addTickables(bassNotes)

    Accidental.applyAccidentals([trebleVoice], key)
    Accidental.applyAccidentals([bassVoice], key)

    new Formatter().joinVoices([trebleVoice]).format([trebleVoice], STAVE_WIDTH - 80)
    new Formatter().joinVoices([bassVoice]).format([bassVoice], STAVE_WIDTH - 80)

    trebleVoice.draw(ctx, trebleStave)
    bassVoice.draw(ctx, bassStave)

    // Beam in two groups of 4
    ;[trebleNotes, bassNotes].forEach(notes => {
      [notes.slice(0, 4), notes.slice(4)].forEach(group => {
        if (group.length > 1) new Beam(group).setContext(ctx).draw()
      })
    })
  }

  $effect(() => {
    const key = musicalKey
    if (container) render(container, key)
  })
</script>

<div bind:this={container} class="staff-container"></div>

<style>
  .staff-container {
    width: 100%;
    overflow-x: auto;
    display: flex;
    justify-content: center;
  }

  .staff-container :global(svg) {
    display: block;
    max-width: 100%;
  }

  /* Override VexFlow's default black rendering for dark theme */
  .staff-container :global(svg path),
  .staff-container :global(svg rect),
  .staff-container :global(svg text) {
    fill: var(--color-text);
    stroke: var(--color-text);
  }
</style>
