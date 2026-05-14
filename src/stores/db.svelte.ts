import {
  openDB,
  getAllInstruments,
  getExercisesByInstrument,
  incrementPlayCount as idbIncrementPlayCount,
  updateInstrumentLastPracticed as idbUpdateInstrumentLastPracticed,
  getLastSessionForExercise as idbGetLastSessionForExercise,
} from '../lib/db/idb'
import type { InstrumentRecord, ExerciseRecord, SessionRecord } from '../lib/db/schema'

let db: IDBDatabase | null = $state(null)
let instruments: InstrumentRecord[] = $state([])
let exercisesByInstrument: Record<string, ExerciseRecord[]> = $state({})
let ready = $state(false)

export const dbState = {
  get db() { return db },
  get instruments() { return instruments },
  get exercisesByInstrument() { return exercisesByInstrument },
  get ready() { return ready },
}

export async function initDB(): Promise<void> {
  const opened = await openDB()
  db = opened

  instruments = await getAllInstruments(db)

  const piano = await getExercisesByInstrument(db, 'piano')
  const voice = await getExercisesByInstrument(db, 'voice')
  exercisesByInstrument = { piano, voice }

  ready = true
}

export async function refreshExercises(instrumentId: string): Promise<void> {
  if (!db) return
  const updated = await getExercisesByInstrument(db, instrumentId)
  exercisesByInstrument = { ...exercisesByInstrument, [instrumentId]: updated }
}

export async function refreshInstruments(): Promise<void> {
  if (!db) return
  instruments = await getAllInstruments(db)
}

export async function incrementPlayCount(exerciseId: string, instrumentId: string): Promise<void> {
  if (!db) return
  await idbIncrementPlayCount(db, exerciseId)
  await idbUpdateInstrumentLastPracticed(db, instrumentId, Date.now())
  await refreshExercises(instrumentId)
  await refreshInstruments()
}

export async function getLastSession(exerciseId: string): Promise<SessionRecord | null> {
  if (!db) return null
  return idbGetLastSessionForExercise(db, exerciseId)
}
