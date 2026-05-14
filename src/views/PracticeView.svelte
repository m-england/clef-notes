<script lang="ts">
  import BackArrow from '../lib/ui/BackArrow.svelte'
  import { navigate } from '../stores/navigation.svelte'
  import { dbState } from '../stores/db.svelte'

  function daysSince(timestamp: number | null): string {
    if (timestamp === null) return 'Never'
    const days = Math.floor((Date.now() - timestamp) / 86_400_000)
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    return `${days} days ago`
  }

  const instruments = [
    { id: 'piano', label: 'Piano', icon: '🎹' },
    { id: 'voice', label: 'Voice', icon: '🎤' },
  ] as const

  function getLastPracticed(id: string): string {
    const record = dbState.instruments.find(i => i.id === id)
    return daysSince(record?.lastPracticedAt ?? null)
  }
</script>

<div class="practice-view">
  <BackArrow />

  <div class="content">
    <h2 class="heading">Choose Instrument</h2>

    <div class="cards">
      {#each instruments as inst}
        <button
          class="card"
          onclick={() => navigate('exercise-list', { instrumentId: inst.id })}
        >
          <span class="card-icon">{inst.icon}</span>
          <span class="card-label">{inst.label}</span>
          <span class="card-last">Last practiced: {getLastPracticed(inst.id)}</span>
        </button>
      {/each}
    </div>
  </div>
</div>

<style>
  .practice-view {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg);
  }

  .content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-10);
  }

  .heading {
    font-size: var(--text-2xl);
    font-weight: 800;
    letter-spacing: -0.01em;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-size: var(--text-sm);
  }

  .cards {
    display: flex;
    gap: var(--space-6);
    flex-wrap: wrap;
    justify-content: center;
  }

  .card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-10) var(--space-12);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 16px;
    cursor: pointer;
    min-width: 220px;
    transition:
      border-color var(--duration-normal),
      background var(--duration-normal),
      transform var(--duration-fast) var(--ease-out-quart),
      box-shadow var(--duration-normal);
    font-family: var(--font-sans);
  }

  .card:hover {
    border-color: var(--color-accent);
    background: var(--color-surface-raised);
    transform: translateY(-4px);
    box-shadow: 0 8px 32px var(--color-accent-dim);
  }

  .card:active {
    transform: translateY(-2px) scale(0.98);
  }

  .card-icon {
    font-size: 3rem;
    line-height: 1;
  }

  .card-label {
    font-size: var(--text-2xl);
    font-weight: 800;
    color: var(--color-text);
    letter-spacing: -0.01em;
  }

  .card-last {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    font-weight: 500;
  }
</style>
