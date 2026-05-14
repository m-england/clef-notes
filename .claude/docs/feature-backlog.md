# Feature Backlog

Planned features in rough priority order. None of these are implemented yet.

---

## Session Recording

Right now Start increments play count but doesn't write a `SessionRecord` to IndexedDB. Before building real exercises, wire up the full session lifecycle: open a record when Start is pressed, close it (with results) when the exercise ends or the user backs out. This is the foundation everything else depends on.

---

## Real Exercises

The registry/stub architecture is ready for this. Each exercise gets a Svelte component wired in via an optional `component` field on `ExerciseDefinition`. `ExerciseDetailView` renders it when present, falls back to the current stub UI when absent. Build exercises one at a time — piano and voice each have 5 stubs waiting.

---

## Stats Screen

All the raw data will be in IndexedDB once session recording is in place. Surface it on the Stats screen: practice streak, total sessions, time spent per instrument, most/least played exercises. The `sessions` object store already has the right shape for this.

---

## Settings Screen

Configurable preferences, likely including: default tempo, preferred starting key, exercise visibility (hide exercises you don't want), and reminder time for daily practice notifications.

---

## Practice Reminders

Daily practice reminder via the Web Notifications API. User sets a preferred time in Settings. No backend needed — can be approximated with a persistent notification or a simple prompt on app open if the user hasn't practiced today.
