import { pianoExercises } from './piano'
import { voiceExercises } from './voice'
import type { Component } from 'svelte'

export interface ExerciseComponentProps {
  sessionId: string
  bpm: number
  onComplete: (results: Record<string, unknown>) => void
}

export interface ExerciseDefinition {
  id: string
  instrumentId: 'piano' | 'voice'
  title: string
  description: string
  category: string
  component?: Component<ExerciseComponentProps>
}

export const ALL_EXERCISES: ExerciseDefinition[] = [
  ...pianoExercises,
  ...voiceExercises,
]

export function getExercise(id: string): ExerciseDefinition | undefined {
  return ALL_EXERCISES.find(e => e.id === id)
}

export function getExercisesForInstrument(instrumentId: string): ExerciseDefinition[] {
  return ALL_EXERCISES.filter(e => e.instrumentId === instrumentId)
}
