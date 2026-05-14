export interface InstrumentRecord {
  id: 'piano' | 'voice'
  label: string
  lastPracticedAt: number | null
}

export interface ExerciseRecord {
  id: string
  instrumentId: string
  playCount: number
  lastPlayedAt: number | null
}

export interface SessionResults {
  [key: string]: unknown
}

export interface SessionRecord {
  id: string
  exerciseId: string
  instrumentId: string
  startedAt: number
  completedAt: number | null
  results: SessionResults | null
}
