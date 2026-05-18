<script lang="ts">
  import { Renderer, Stave, StaveNote, Formatter, Voice, Accidental } from 'vexflow'
  import { Note, Interval } from 'tonal'

  let { musicalKey }: { musicalKey: string } = $props()

  let container: HTMLDivElement = $state() as HTMLDivElement

  const RENDER_WIDTH = 640
  const RENDER_HEIGHT = 240
  const STAVE_WIDTH = 620
  const MARGIN_X = 10
  const TREBLE_Y = 20
  const BASS_Y = 130

  // Build the three triad inversions for a given root and clef.
  // Each inversion is a chord (StaveNote with multiple keys).
  // Treble: root pos starts at octave 4, bass: octave 2.
  function buildTriadChords(clef: string, root: string, startOctave: number): StaveNote[] {
    // Root, major third, perfect fifth
    const r = `${root}${startOctave}`
    const third = Note.transpose(r, Interval.fromSemitones(4))
    const fifth = Note.transpose(r, Interval.fromSemitones(7))

    // 1st inversion: third in bass, root and fifth above
    const r1 = `${root}${startOctave + 1}`
    const inv1_bottom = third
    const inv1_mid = fifth
    const inv1_top = r1

    // 2nd inversion: fifth in bass, root and third above
    const inv2_bottom = fifth
    const inv2_mid = r1
    const inv2_top = Note.transpose(r1, Interval.fromSemitones(4))

    // Ascending: root pos → 1st inv → 2nd inv
    // Descending: 1st inv → root pos
    const chords = [
      [r, third, fifth],
      [inv1_bottom, inv1_mid, inv1_top],
      [inv2_bottom, inv2_mid, inv2_top],
      [inv1_bottom, inv1_mid, inv1_top],
      [r, third, fifth],
    ]

    return chords.map(noteSet =>
      new StaveNote({
        clef,
        keys: noteSet.map(toVexKey),
        duration: 'h',
      })
    )
  }

  function toVexKey(tonalNote: string): string {
    const match = tonalNote.match(/^([A-Ga-g][b#]?)(\d)$/)
    if (!match) throw new Error(`Invalid note: ${tonalNote}`)
    return `${match[1].toLowerCase()}/${match[2]}`
  }

  function render(el: HTMLDivElement, key: string) {
    el.innerHTML = ''

    const renderer = new Renderer(el, Renderer.Backends.SVG)
    const ctx = renderer.getContext()

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

    // Treble: start at octave 4; Bass: start at octave 2
    const trebleChords = buildTriadChords('treble', key, 4)
    const bassChords = buildTriadChords('bass', key, 2)

    const trebleVoice = new Voice({ numBeats: 10, beatValue: 4 })
      .setMode(Voice.Mode.SOFT)
      .addTickables(trebleChords)

    const bassVoice = new Voice({ numBeats: 10, beatValue: 4 })
      .setMode(Voice.Mode.SOFT)
      .addTickables(bassChords)

    Accidental.applyAccidentals([trebleVoice], key)
    Accidental.applyAccidentals([bassVoice], key)

    new Formatter().joinVoices([trebleVoice]).format([trebleVoice], STAVE_WIDTH - 100)
    new Formatter().joinVoices([bassVoice]).format([bassVoice], STAVE_WIDTH - 100)

    trebleVoice.draw(ctx, trebleStave)
    bassVoice.draw(ctx, bassStave)
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
