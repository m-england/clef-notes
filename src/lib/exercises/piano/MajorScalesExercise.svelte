<script lang="ts">
  import { onMount } from 'svelte'
  import { createMetronome } from '../../metronome'

  let { sessionId, bpm, onComplete }: {
    sessionId: string
    bpm: number
    onComplete: (results: Record<string, unknown>) => void
  } = $props()

  const metronome = createMetronome(0)

  const CIRCLE_OF_FIFTHS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F']

  const startOffset = Math.floor(Math.random() * 12)
  const keys = [...CIRCLE_OF_FIFTHS.slice(startOffset), ...CIRCLE_OF_FIFTHS.slice(0, startOffset)]

  let currentIndex = $state(0)
  let elapsedSeconds = $state(0)
  let keyStartTime = Date.now()
  const sessionStartTime = Date.now()
  let timePerKey: Record<string, number> = {}
  let keysCompleted: string[] = $state([])

  function formatTime(s: number): string {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }

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
    const id = setInterval(() => { elapsedSeconds++ }, 1000)
    return () => {
      metronome.stop()
      clearInterval(id)
    }
  })
</script>

<div class="exercise">
  <div class="progress">
    {currentIndex + 1} / 12
  </div>

  <div class="key-display">
    {keys[currentIndex]}
  </div>

  <div class="timer">
    {formatTime(elapsedSeconds)}
  </div>

  <div class="actions">
    <button class="btn btn-primary next-btn" onclick={handleNextKey}>
      {currentIndex === 11 ? 'Done' : 'Next Key'}
    </button>
    {#if currentIndex < 11}
      <button class="btn btn-secondary" onclick={handleFinish}>
        Finish early
      </button>
    {/if}
  </div>
</div>

<style>
  .exercise {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-8);
    padding: var(--space-8) 0;
  }

  .progress {
    font-size: var(--text-sm);
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .key-display {
    font-size: clamp(5rem, 20vw, 8rem);
    font-weight: 900;
    letter-spacing: -0.04em;
    color: var(--color-accent);
    line-height: 1;
    min-width: 3ch;
    text-align: center;
  }

  .timer {
    font-size: var(--text-xl);
    font-weight: 600;
    color: var(--color-text-muted);
    font-variant-numeric: tabular-nums;
  }

  .actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-4);
    width: 100%;
  }

  .next-btn {
    width: 100%;
    padding: var(--space-5);
    font-size: var(--text-xl);
  }
</style>
