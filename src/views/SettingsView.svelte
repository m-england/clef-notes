<script lang="ts">
  import BackArrow from '../lib/ui/BackArrow.svelte'
</script>

<div class="view">
  <BackArrow />
  <div class="content">
    <h1 class="title">Settings</h1>
    <p class="subtitle">Coming soon</p>
  </div>
</div>

<style>
  .view {
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
    gap: var(--space-3);
  }

  .title {
    font-size: var(--text-3xl);
    font-weight: 900;
    letter-spacing: -0.02em;
    color: var(--color-text);
  }

  .subtitle {
    font-size: var(--text-base);
    color: var(--color-text-muted);
  }
</style>
