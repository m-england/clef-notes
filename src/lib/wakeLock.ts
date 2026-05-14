let wakeLock: WakeLockSentinel | null = null

export async function acquireWakeLock(): Promise<void> {
  if (!('wakeLock' in navigator)) return
  try {
    wakeLock = await navigator.wakeLock.request('screen')
    document.addEventListener('visibilitychange', handleVisibilityChange)
  } catch {
    // Not critical — silently ignore
  }
}

export async function releaseWakeLock(): Promise<void> {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  await wakeLock?.release()
  wakeLock = null
}

async function handleVisibilityChange() {
  if (document.visibilityState === 'visible') await acquireWakeLock()
}
