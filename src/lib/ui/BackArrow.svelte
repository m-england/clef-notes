<script lang="ts">
  import { back } from '../../stores/navigation.svelte'
</script>

<button class="back-arrow" onclick={back} aria-label="Go back">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
</button>

<style>
  .back-arrow {
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

  .back-arrow:hover {
    color: var(--color-text);
    border-color: var(--color-accent);
    background: var(--color-surface);
    transform: translateX(-2px);
  }

  .back-arrow:active {
    transform: translateX(-2px) scale(0.95);
  }

  .back-arrow svg {
    width: 20px;
    height: 20px;
  }
</style>
