<script lang="ts">
  import { onMount } from 'svelte'
  import { createMetronome } from '../../metronome'
  import TriadStaff from '../../ui/TriadStaff.svelte'

  let { sessionId, bpm, title, onBack, onComplete }: {
    sessionId: string
    bpm: number
    title: string
    onBack: () => void
    onComplete: (results: Record<string, unknown>) => void
  } = $props()

  const metronome = createMetronome(0)

  const CIRCLE_OF_FIFTHS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F']

  const startOffset = Math.floor(Math.random() * 12)
  const keys = [...CIRCLE_OF_FIFTHS.slice(startOffset), ...CIRCLE_OF_FIFTHS.slice(0, startOffset)]

  let currentIndex = $state(0)
  let keyStartTime = Date.now()
  const sessionStartTime = Date.now()
  let timePerKey: Record<string, number> = {}
  let keysCompleted: string[] = $state([])

  function finish() {
    const totalSeconds = Math.round((Date.now() - sessionStartTime) / 1000)
    onComplete({ bpm, totalSeconds, keysCompleted: [...keysCompleted], timePerKey })
  }

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

  function handleFinish() {
    const key = keys[currentIndex]
    const spent = Math.round((Date.now() - keyStartTime) / 1000)
    timePerKey[key] = spent
    finish()
  }

  onMount(() => {
    metronome.setBpm(bpm)
    metronome.start()
    return () => metronome.stop()
  })
</script>

<div class="exercise">
  <div class="top-bar">
    <button class="back-btn" onclick={onBack} aria-label="Go back">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>
    <span class="exercise-title">{title}</span>
    <span class="key-display">{keys[currentIndex]}</span>
  </div>

  <div class="staff-wrap">
    <div class="fingering-row treble-row">
      <span class="clef-label">Treble</span>
      <span class="fingering">1–3–5 · 1–2–5 · 1–3–5</span>
    </div>
    <TriadStaff musicalKey={keys[currentIndex]} />
    <div class="fingering-row bass-row">
      <span class="clef-label">Bass</span>
      <span class="fingering">5–3–1 · 5–2–1 · 5–3–1</span>
    </div>
  </div>

  <div class="actions">
    <button class="btn btn-primary next-btn" onclick={handleNextKey}>
      {currentIndex === 11 ? 'Done' : 'Next Key'}
    </button>
    {#if currentIndex < 11}
      <button class="btn btn-secondary finish-btn" onclick={handleFinish}>
        Finish early
      </button>
    {/if}
  </div>
</div>

<style>
  .exercise {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding: var(--space-3) var(--space-4) var(--space-4);
  }

  .top-bar {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex-shrink: 0;
  }

  .back-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 44px;
    height: 44px;
    background: var(--color-surface-raised);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    color: var(--color-text-muted);
    cursor: pointer;
    transition:
      color var(--duration-fast),
      border-color var(--duration-fast),
      background var(--duration-fast),
      transform var(--duration-fast) var(--ease-out-quart);
  }

  .back-btn:hover {
    color: var(--color-text);
    border-color: var(--color-accent);
    background: var(--color-surface);
    transform: translateX(-2px);
  }

  .back-btn svg {
    width: 20px;
    height: 20px;
  }

  .exercise-title {
    font-size: var(--text-sm);
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--color-text-muted);
    flex: 1;
  }

  .key-display {
    font-size: var(--text-3xl);
    font-weight: 900;
    letter-spacing: -0.02em;
    color: var(--color-accent);
    line-height: 1;
    min-width: 2.5ch;
    text-align: right;
  }

  .staff-wrap {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .fingering-row {   
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: var(--space-3);
    pointer-events: none;
  }

  .treble-row { top: 0; }
  .bass-row { bottom: 0; }

  .clef-label {
    font-size: var(--text-sm);
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--color-text-muted);
    min-width: 3.5ch;
    text-align: right;
  }

  .fingering {
    font-size: var(--text-xl);
    font-weight: 700;
    color: var(--color-text);
    letter-spacing: 0.04em;
  }

  .actions {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex-shrink: 0;
  }

  .next-btn {
    flex: 1;
    padding: var(--space-3) var(--space-4);
    font-size: var(--text-base);
  }

  .finish-btn {
    padding: var(--space-3) var(--space-4);
    font-size: var(--text-sm);
  }
</style>
