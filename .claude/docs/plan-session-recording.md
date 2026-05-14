# Plan: Session Recording

**Feature:** Wire up the full session lifecycle so that pressing Start opens a `SessionRecord` in IndexedDB and navigating back (or ending the exercise) closes it with a timestamp and results payload.

**Prerequisite for:** Real Exercises, Stats Screen — everything that needs historical data.

---

## Current state

`handleStart` in `ExerciseDetailView.svelte` calls `incrementPlayCount` and `acquireWakeLock`, but never writes a `SessionRecord`. `handleBack` releases the wake lock but doesn't close anything. The `sessions` object store, the `SessionRecord` type, and the raw `addSession` IDB helper are all already in place and unused by the live UI.

---

## Files to change

| File | What changes |
|---|---|
| `src/lib/db/idb.ts` | Add `openSession` (wraps existing `addSession`, returns `id`) and `closeSession` (reads + patches record) |
| `src/stores/db.svelte.ts` | Add exported `openSession` and `closeSession` wrappers |
| `src/views/ExerciseDetailView.svelte` | Add `activeSessionId` state; call `openSession` in `handleStart`, `closeSession` in `handleBack` |

No new files. No DB version bump — the `sessions` store is already in version 1.

---

## Step 1 — `src/lib/db/idb.ts`

Add two functions after the existing `addSession` (line 128).

### `openSession`

```ts
export async function openSession(db: IDBDatabase, session: SessionRecord): Promise<string> {
  await addSession(db, session)
  return session.id
}
```

Thin wrapper so callers get the ID back without having to construct it themselves and pass it separately.

### `closeSession`

```ts
export function closeSession(
  db: IDBDatabase,
  sessionId: string,
  completedAt: number,
  results: SessionResults | null
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sessions', 'readwrite')
    const store = tx.objectStore('sessions')
    const getReq = store.get(sessionId)
    getReq.onsuccess = () => {
      const record = getReq.result as SessionRecord
      if (!record) { resolve(); return }
      record.completedAt = completedAt
      record.results = results
      const putReq = store.put(record)
      putReq.onsuccess = () => resolve()
      putReq.onerror = () => reject(putReq.error)
    }
    getReq.onerror = () => reject(getReq.error)
  })
}
```

Follows the same get-then-put pattern as `incrementPlayCount` (line 93) and `updateInstrumentLastPracticed` (line 111).

---

## Step 2 — `src/stores/db.svelte.ts`

Add two exports alongside the existing `incrementPlayCount` and `getLastSession`.

Add the new IDB imports at the top:
```ts
import {
  // ...existing imports...
  openSession as idbOpenSession,
  closeSession as idbCloseSession,
} from '../lib/db/idb'
```

Also import `SessionResults` from the schema:
```ts
import type { InstrumentRecord, ExerciseRecord, SessionRecord, SessionResults } from '../lib/db/schema'
```

New store functions:

```ts
export async function openSession(exerciseId: string, instrumentId: string): Promise<string | null> {
  if (!db) return null
  const session: SessionRecord = {
    id: crypto.randomUUID(),
    exerciseId,
    instrumentId,
    startedAt: Date.now(),
    completedAt: null,
    results: null,
  }
  return idbOpenSession(db, session)
}

export async function closeSession(sessionId: string, results: SessionResults | null = null): Promise<void> {
  if (!db) return
  await idbCloseSession(db, sessionId, Date.now(), results)
}
```

`closeSession` doesn't need to refresh any reactive state — sessions aren't read into `dbState` yet, and `getLastSession` fetches on demand.

---

## Step 3 — `src/views/ExerciseDetailView.svelte`

### Imports

Add `openSession` and `closeSession` to the import from `'../stores/db.svelte'`:
```ts
import { incrementPlayCount, getLastSession, openSession, closeSession } from '../stores/db.svelte'
```

### New state

Add alongside the existing `let exerciseActive`:
```ts
let activeSessionId: string | null = $state(null)
```

### `handleStart` (currently line 28)

Open the session first, then increment the play count, then acquire the wake lock:

```ts
async function handleStart() {
  exerciseActive = true
  activeSessionId = await openSession(exerciseId, instrumentId)
  await incrementPlayCount(exerciseId, instrumentId)
  await acquireWakeLock()
}
```

Session is opened before `incrementPlayCount` so the record exists in IDB before the count ticks up — consistent ordering if anything reads both in the future.

### `handleBack` (currently line 35)

Close the session before releasing the wake lock:

```ts
async function handleBack() {
  if (exerciseActive) {
    if (activeSessionId) {
      await closeSession(activeSessionId, null)
      activeSessionId = null
    }
    await releaseWakeLock()
    exerciseActive = false
  }
  back()
}
```

`results` is `null` for now. Real exercise components will call `closeSession` themselves (with actual results) and set `exerciseActive = false` before the user hits back — at that point `activeSessionId` will already be null and the guard skips cleanly.

---

## What this does NOT change

- **No DB version bump** — `sessions` store already exists in version 1.
- **No schema changes** — `SessionRecord.completedAt` and `SessionRecord.results` are already nullable.
- **`getLastSession` refresh** — the `$effect` in `ExerciseDetailView` re-fires when `exerciseId` changes. When the user navigates back and returns to the same exercise, the effect will pick up the new record. No extra refresh needed.
- **Stats screen** — still reads zero sessions (as today). This plan just populates the store; the Stats feature reads from it.

---

## Future hook-in point for real exercises

When a real exercise component finishes, it should call `closeSession(activeSessionId, results)` directly rather than waiting for `handleBack`. The component will need `activeSessionId` passed as a prop. `handleBack` already guards against double-closing via the `activeSessionId` null check.
