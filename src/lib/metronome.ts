export interface Metronome {
  start(): void
  stop(): void
  setBpm(bpm: number): void
}

export function createMetronome(initialBpm: number): Metronome {
  let audioCtx: AudioContext | null = null
  let nextBeatTime = 0
  let beatIndex = 0
  let intervalId: ReturnType<typeof setInterval> | null = null
  let currentBpm = initialBpm

  function scheduleClick(time: number, isDownbeat: boolean) {
    const osc = audioCtx!.createOscillator()
    const gain = audioCtx!.createGain()
    osc.connect(gain)
    gain.connect(audioCtx!.destination)

    osc.frequency.value = isDownbeat ? 1000 : 600
    gain.gain.setValueAtTime(0, time)
    gain.gain.linearRampToValueAtTime(0.7, time + 0.001)
    gain.gain.linearRampToValueAtTime(0, time + (isDownbeat ? 0.03 : 0.02))

    osc.start(time)
    osc.stop(time + 0.05)
  }

  function scheduler() {
    while (nextBeatTime < audioCtx!.currentTime + 0.1) {
      scheduleClick(nextBeatTime, beatIndex === 0)
      nextBeatTime += 60 / currentBpm
      beatIndex = (beatIndex + 1) % 4
    }
  }

  function start() {
    audioCtx = new AudioContext()
    nextBeatTime = audioCtx.currentTime
    beatIndex = 0
    intervalId = setInterval(scheduler, 25)
  }

  function stop() {
    if (intervalId) clearInterval(intervalId)
    audioCtx?.close()
    audioCtx = null
  }

  function setBpm(bpm: number) {
    currentBpm = bpm
  }

  return { start, stop, setBpm }
}
