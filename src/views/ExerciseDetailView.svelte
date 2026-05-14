<script lang="ts">
  import { onMount } from 'svelte'
  import BackArrow from '../lib/ui/BackArrow.svelte'
  import { current, back } from '../stores/navigation.svelte'
  import { incrementPlayCount, getLastSession, openSession, closeSession } from '../stores/db.svelte'
  import { getExercise } from '../lib/exercises/registry'
  import { acquireWakeLock, releaseWakeLock } from '../lib/wakeLock'
  import type { SessionRecord } from '../lib/db/schema'

  const exerciseId = $derived(current().params.exerciseId as string)
  const instrumentId = $derived(current().params.instrumentId as string)
  const def = $derived(getExercise(exerciseId))

  let lastSession: SessionRecord | null = $state(null)
  let exerciseActive = $state(false)
  let activeSessionId: string | null = $state(null)

  $effect(() => {
    const id = exerciseId
    getLastSession(id).then(s => { lastSession = s })
  })

  function formatDate(ts: number): string {
    return new Date(ts).toLocaleDateString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric',
    })
  }

  async function handleStart() {
    exerciseActive = true
    activeSessionId = await openSession(exerciseId, instrumentId)
    await incrementPlayCount(exerciseId, instrumentId)
    await acquireWakeLock()
  }

  async function handleBack() {
    if (exerciseActive) {
      if (activeSessionId) {
        await closeSession(activeSessionId, null)
        activeSessionId = null
      }
      await releaseWakeLock()
      exerciseActive = false
    }
    back()
  }
</script>

<div class="detail-view">
  <button class="back-arrow-wrap" onclick={handleBack} aria-label="Go back">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  </button>

  <div class="content">
    {#if def}
      <div class="header">
        <span class="category">{def.category}</span>
        <h1 class="title">{def.title}</h1>
      </div>

      <p class="description">{def.description}</p>

      <div class="last-session">
        <h3 class="section-label">Last Session</h3>
        {#if lastSession}
          <div class="session-info">
            <span class="session-date">{formatDate(lastSession.startedAt)}</span>
            {#if lastSession.results}
              <pre class="session-results">{JSON.stringify(lastSession.results, null, 2)}</pre>
            {:else}
              <span class="session-no-results">No results recorded.</span>
            {/if}
          </div>
        {:else}
          <p class="no-session">No previous sessions.</p>
        {/if}
      </div>

      <button class="btn btn-primary start-btn" onclick={handleStart}>
        Start
      </button>
    {:else}
      <p style="color: var(--color-text-muted)">Exercise not found.</p>
    {/if}
  </div>
</div>

<style>
  .detail-view {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    background: var(--color-bg);
    padding-top: var(--space-16);
    padding-bottom: var(--space-8);
    overflow-y: auto;
  }

  /* Inline back arrow needed here to intercept wake lock release */
  .back-arrow-wrap {
    position: absolute;
    top: var(--space-5);
    left: var(--space-5);
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
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

  .back-arrow-wrap:hover {
    color: var(--color-text);
    border-color: var(--color-accent);
    background: var(--color-surface);
    transform: translateX(-2px);
  }

  .back-arrow-wrap svg {
    width: 20px;
    height: 20px;
  }

  .content {
    width: 100%;
    max-width: 600px;
    padding: 0 var(--space-6);
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
  }

  .header {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    align-items: flex-start;
  }

  .category {
    font-size: var(--text-xs);
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--color-accent);
    background: var(--color-accent-dim);
    padding: 2px var(--space-2);
    border-radius: 4px;
  }

  .title {
    font-size: var(--text-3xl);
    font-weight: 900;
    letter-spacing: -0.02em;
    color: var(--color-text);
    line-height: 1.1;
  }

  .description {
    font-size: var(--text-base);
    color: var(--color-text-muted);
    line-height: 1.7;
  }

  .last-session {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: var(--space-6);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .section-label {
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .session-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .session-date {
    font-size: var(--text-base);
    font-weight: 600;
    color: var(--color-text);
  }

  .session-results {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    background: var(--color-bg);
    border-radius: 8px;
    padding: var(--space-3);
    overflow-x: auto;
    font-family: monospace;
  }

  .session-no-results {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  .no-session {
    font-size: var(--text-base);
    color: var(--color-text-muted);
  }

  .start-btn {
    align-self: stretch;
    padding: var(--space-5);
    font-size: var(--text-xl);
  }
</style>
