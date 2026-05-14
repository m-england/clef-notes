# Clef Notes

A vocal and piano practice app with a video game menu aesthetic. Track your exercises, see your history, and keep a daily practice habit — all stored locally on your device with no account or backend required.

## Features

- **Piano and Voice** practice tracks, each with their own exercise list
- Exercises sorted by most to least played so your frequent work is always at the top
- Last session history shown before you start an exercise
- Screen stays awake during practice (via the Web Screen Wake Lock API)
- Fully offline — all data lives in IndexedDB on your device

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Navigation

The app works like a game menu — no browser chrome, no nav bar, no footer.

```
Home
 ├── Practice
 │    ├── Piano → exercise list → exercise detail → [exercise]
 │    └── Voice → exercise list → exercise detail → [exercise]
 ├── Stats
 └── Settings
```

The back arrow in the top-left of every sub-screen returns you to the previous screen.

## Project structure

```
src/
├── App.svelte                  # View orchestrator + slide transitions
├── app.css                     # Global design system (tokens, resets, buttons, keyframes)
├── main.ts                     # Entry point
├── stores/
│   ├── navigation.svelte.ts    # View stack — navigate() / back() / current()
│   └── db.svelte.ts            # Reactive IndexedDB wrapper
├── lib/
│   ├── db/
│   │   ├── schema.ts           # TypeScript types for DB records
│   │   └── idb.ts              # Raw IndexedDB helpers and seed logic
│   ├── exercises/
│   │   ├── registry.ts         # Static exercise definitions
│   │   ├── piano/index.ts      # Piano exercise list
│   │   └── voice/index.ts      # Voice exercise list
│   ├── ui/
│   │   └── BackArrow.svelte    # Shared back button component
│   └── wakeLock.ts             # Screen Wake Lock API wrapper
└── views/
    ├── HomeView.svelte
    ├── PracticeView.svelte
    ├── ExerciseListView.svelte
    ├── ExerciseDetailView.svelte
    ├── StatsView.svelte
    └── SettingsView.svelte
```

## Tech

- [Svelte 5](https://svelte.dev) + TypeScript
- [Vite](https://vite.dev)
- IndexedDB (via native browser API)
- Pure CSS — no framework

## Other commands

```bash
pnpm build      # Production build
pnpm preview    # Preview production build locally
pnpm check      # TypeScript + Svelte type checking
```
