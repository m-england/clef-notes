<script lang="ts">
  import { onMount } from 'svelte'
  import { current, navDirection } from './stores/navigation.svelte'
  import { initDB } from './stores/db.svelte'
  import HomeView from './views/HomeView.svelte'
  import PracticeView from './views/PracticeView.svelte'
  import ExerciseListView from './views/ExerciseListView.svelte'
  import ExerciseDetailView from './views/ExerciseDetailView.svelte'
  import StatsView from './views/StatsView.svelte'
  import SettingsView from './views/SettingsView.svelte'

  const TRANSITION_DURATION = 320

  let activeView = $state(current().view)
  let leavingView: string | null = $state(null)
  let enterClass = $state('')
  let leaveClass = $state('')
  let transitionTimer: ReturnType<typeof setTimeout> | null = null

  $effect(() => {
    const next = current().view
    if (next === activeView) return

    if (transitionTimer) clearTimeout(transitionTimer)

    const dir = navDirection()
    enterClass = dir === 'forward' ? 'enter-forward' : 'enter-back'
    leaveClass = dir === 'forward' ? 'leave-forward' : 'leave-back'

    leavingView = activeView
    activeView = next

    transitionTimer = setTimeout(() => {
      leavingView = null
    }, TRANSITION_DURATION)
  })

  onMount(() => {
    initDB()
  })
</script>

<div class="viewport">
  {#if leavingView}
    <div class="view-wrapper {leaveClass}" aria-hidden="true">
      {#if leavingView === 'home'}
        <HomeView />
      {:else if leavingView === 'practice'}
        <PracticeView />
      {:else if leavingView === 'exercise-list'}
        <ExerciseListView />
      {:else if leavingView === 'exercise-detail'}
        <ExerciseDetailView />
      {:else if leavingView === 'stats'}
        <StatsView />
      {:else if leavingView === 'settings'}
        <SettingsView />
      {/if}
    </div>
  {/if}

  <div class="view-wrapper {enterClass}">
    {#if activeView === 'home'}
      <HomeView />
    {:else if activeView === 'practice'}
      <PracticeView />
    {:else if activeView === 'exercise-list'}
      <ExerciseListView />
    {:else if activeView === 'exercise-detail'}
      <ExerciseDetailView />
    {:else if activeView === 'stats'}
      <StatsView />
    {:else if activeView === 'settings'}
      <SettingsView />
    {/if}
  </div>
</div>
