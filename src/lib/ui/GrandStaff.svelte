<script lang="ts">
  import { Renderer, Stave, StaveNote, Formatter, Voice, Beam, Accidental } from 'vexflow'
  import { Scale } from 'tonal'

  let { musicalKey }: { musicalKey: string } = $props()

  let container: HTMLDivElement = $state() as HTMLDivElement

  const RENDER_WIDTH = 560
  const RENDER_HEIGHT = 240
  const STAVE_WIDTH = 540
  const MARGIN_X = 10
  const TREBLE_Y = 20
  const BASS_Y = 130

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
    const ctx = renderer.getContext()

    // Set viewBox so CSS can scale the SVG up without distortion
    const svg = el.querySelector('svg')!
    svg.setAttribute('viewBox', `0 0 ${RENDER_WIDTH} ${RENDER_HEIGHT}`)
    svg.setAttribute('width', '100%')
    svg.removeAttribute('height')

    const trebleStave = new Stave(MARGIN_X, TREBLE_Y, STAVE_WIDTH)
    trebleStave.addClef('treble').addKeySignature(key)
    trebleStave.setContext(ctx).draw()

    const bassStave = new Stave(MARGIN_X, BASS_Y, STAVE_WIDTH)
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
    width: 90%;
    overflow-x: auto;
  }

  .staff-container :global(svg) {
    display: block;
    width: 100%;
    height: auto;
  }
</style>
