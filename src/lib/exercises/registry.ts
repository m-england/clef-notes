import { pianoExercises } from './piano'
import { voiceExercises } from './voice'

export interface ExerciseDefinition {
  id: string
  instrumentId: 'piano' | 'voice'
  title: string
  description: string
  category: string
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
