import type { InstrumentRecord, ExerciseRecord, SessionRecord } from './schema'
import { ALL_EXERCISES } from '../exercises/registry'

const DB_NAME = 'clef-notes-db'
const DB_VERSION = 1

let dbInstance: IDBDatabase | null = null

export function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance)

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains('instruments')) {
        db.createObjectStore('instruments', { keyPath: 'id' })
      }

      if (!db.objectStoreNames.contains('exercises')) {
        const exStore = db.createObjectStore('exercises', { keyPath: 'id' })
        exStore.createIndex('instrumentId', 'instrumentId', { unique: false })
      }

      if (!db.objectStoreNames.contains('sessions')) {
        const sesStore = db.createObjectStore('sessions', { keyPath: 'id' })
        sesStore.createIndex('exerciseId', 'exerciseId', { unique: false })
        sesStore.createIndex('instrumentId', 'instrumentId', { unique: false })
      }

      const tx = request.transaction!

      const instrumentStore = tx.objectStore('instruments')
      const instruments: InstrumentRecord[] = [
        { id: 'piano', label: 'Piano', lastPracticedAt: null },
        { id: 'voice', label: 'Voice', lastPracticedAt: null },
      ]
      for (const inst of instruments) {
        instrumentStore.put(inst)
      }

      const exerciseStore = tx.objectStore('exercises')
      for (const def of ALL_EXERCISES) {
        const record: ExerciseRecord = {
          id: def.id,
          instrumentId: def.instrumentId,
          playCount: 0,
          lastPlayedAt: null,
        }
        exerciseStore.put(record)
      }
    }

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result
      resolve(dbInstance)
    }

    request.onerror = () => reject(request.error)
  })
}

export function getAllInstruments(db: IDBDatabase): Promise<InstrumentRecord[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('instruments', 'readonly')
    const req = tx.objectStore('instruments').getAll()
    req.onsuccess = () => resolve(req.result as InstrumentRecord[])
    req.onerror = () => reject(req.error)
  })
}

export function getExercisesByInstrument(db: IDBDatabase, instrumentId: string): Promise<ExerciseRecord[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('exercises', 'readonly')
    const index = tx.objectStore('exercises').index('instrumentId')
    const req = index.getAll(instrumentId)
    req.onsuccess = () => resolve(req.result as ExerciseRecord[])
    req.onerror = () => reject(req.error)
  })
}

export function upsertExercise(db: IDBDatabase, record: ExerciseRecord): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('exercises', 'readwrite')
    const req = tx.objectStore('exercises').put(record)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export function incrementPlayCount(db: IDBDatabase, exerciseId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('exercises', 'readwrite')
    const store = tx.objectStore('exercises')
    const getReq = store.get(exerciseId)
    getReq.onsuccess = () => {
      const record = getReq.result as ExerciseRecord
      if (!record) { resolve(); return }
      record.playCount += 1
      record.lastPlayedAt = Date.now()
      const putReq = store.put(record)
      putReq.onsuccess = () => resolve()
      putReq.onerror = () => reject(putReq.error)
    }
    getReq.onerror = () => reject(getReq.error)
  })
}

export function updateInstrumentLastPracticed(db: IDBDatabase, instrumentId: string, timestamp: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('instruments', 'readwrite')
    const store = tx.objectStore('instruments')
    const getReq = store.get(instrumentId)
    getReq.onsuccess = () => {
      const record = getReq.result as InstrumentRecord
      if (!record) { resolve(); return }
      record.lastPracticedAt = timestamp
      const putReq = store.put(record)
      putReq.onsuccess = () => resolve()
      putReq.onerror = () => reject(putReq.error)
    }
    getReq.onerror = () => reject(getReq.error)
  })
}

export function addSession(db: IDBDatabase, session: SessionRecord): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sessions', 'readwrite')
    const req = tx.objectStore('sessions').add(session)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export function getLastSessionForExercise(db: IDBDatabase, exerciseId: string): Promise<SessionRecord | null> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sessions', 'readonly')
    const index = tx.objectStore('sessions').index('exerciseId')
    const req = index.getAll(exerciseId)
    req.onsuccess = () => {
      const sessions = req.result as SessionRecord[]
      if (sessions.length === 0) { resolve(null); return }
      sessions.sort((a, b) => b.startedAt - a.startedAt)
      resolve(sessions[0])
    }
    req.onerror = () => reject(req.error)
  })
}
