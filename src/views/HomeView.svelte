<script lang="ts">
  import { navigate } from '../stores/navigation.svelte'
</script>

<div class="home">
  <div class="content">
    <div class="title-block">
      <span class="title-icon">♪</span>
      <h1 class="title">Clef Notes</h1>
      <p class="subtitle">Your daily practice companion</p>
    </div>

    <div class="menu">
      <button class="btn btn-primary practice-btn" onclick={() => navigate('practice')}>
        Practice
      </button>

      <div class="secondary-actions">
        <button class="btn btn-secondary" onclick={() => navigate('stats')}>
          Stats
        </button>
        <button class="btn btn-secondary" onclick={() => navigate('settings')}>
          Settings
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .home {
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
    gap: var(--space-12);
  }

  .title-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
  }

  .title-icon {
    font-size: 3rem;
    line-height: 1;
    color: var(--color-accent);
    filter: drop-shadow(0 0 16px var(--color-accent-glow));
  }

  .title {
    font-size: var(--text-hero);
    font-weight: 900;
    letter-spacing: -0.02em;
    color: var(--color-text);
    line-height: 1;
  }

  .subtitle {
    font-size: var(--text-base);
    color: var(--color-text-muted);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    font-weight: 500;
  }

  .menu {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-6);
  }

  .practice-btn {
    min-width: 280px;
    padding: var(--space-6) var(--space-12);
    font-size: var(--text-2xl);
    letter-spacing: 0.08em;
  }

  .secondary-actions {
    display: flex;
    gap: var(--space-4);
  }

  .secondary-actions .btn {
    min-width: 120px;
  }
</style>
