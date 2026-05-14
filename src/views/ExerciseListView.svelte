<script lang="ts">
  import BackArrow from '../lib/ui/BackArrow.svelte'
  import { current, navigate } from '../stores/navigation.svelte'
  import { dbState } from '../stores/db.svelte'
  import { getExercise } from '../lib/exercises/registry'

  const instrumentId = $derived(current().params.instrumentId as string)
  const instrumentLabel = $derived(instrumentId === 'piano' ? 'Piano' : 'Voice')

  const exercises = $derived(
    (dbState.exercisesByInstrument[instrumentId] ?? [])
      .slice()
      .sort((a, b) => b.playCount - a.playCount)
      .map(record => ({
        record,
        def: getExercise(record.id),
      }))
      .filter(e => e.def !== undefined)
  )
</script>

<div class="list-view">
  <BackArrow />

  <div class="content">
    <h2 class="heading">{instrumentLabel} Exercises</h2>

    <ul class="exercise-list">
      {#each exercises as { record, def }}
        <li>
          <button
            class="exercise-item"
            onclick={() => navigate('exercise-detail', { exerciseId: record.id, instrumentId })}
          >
            <div class="exercise-main">
              <span class="exercise-title">{def!.title}</span>
              <span class="exercise-category">{def!.category}</span>
            </div>
            <span class="exercise-count">
              {record.playCount === 0 ? 'Never played' : `Played ${record.playCount}×`}
            </span>
          </button>
        </li>
      {/each}
    </ul>
  </div>
</div>

<style>
  .list-view {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    background: var(--color-bg);
    padding-top: var(--space-16);
    padding-bottom: var(--space-8);
  }

  .content {
    width: 100%;
    max-width: 600px;
    padding: 0 var(--space-6);
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .heading {
    font-size: var(--text-sm);
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-text-muted);
    text-align: center;
  }

  .exercise-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .exercise-item {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    padding: var(--space-5) var(--space-6);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    cursor: pointer;
    font-family: var(--font-sans);
    text-align: left;
    transition:
      border-color var(--duration-fast),
      background var(--duration-fast),
      transform var(--duration-fast) var(--ease-out-quart);
  }

  .exercise-item:hover {
    border-color: var(--color-accent);
    background: var(--color-surface-raised);
    transform: translateX(4px);
  }

  .exercise-item:active {
    transform: translateX(4px) scale(0.99);
  }

  .exercise-main {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .exercise-title {
    font-size: var(--text-lg);
    font-weight: 700;
    color: var(--color-text);
  }

  .exercise-category {
    font-size: var(--text-xs);
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--color-accent);
    background: var(--color-accent-dim);
    padding: 2px var(--space-2);
    border-radius: 4px;
    width: fit-content;
  }

  .exercise-count {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    white-space: nowrap;
    flex-shrink: 0;
  }
</style>
