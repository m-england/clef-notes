import type { ExerciseDefinition } from '../registry'

export const pianoExercises: ExerciseDefinition[] = [
  {
    id: 'piano-major-scales',
    instrumentId: 'piano',
    title: 'Major Scales',
    description: 'Practice all 12 major scales, ascending and descending, hands separately then together. Focus on even finger pressure and consistent tempo.',
    category: 'Scales',
  },
  {
    id: 'piano-minor-scales',
    instrumentId: 'piano',
    title: 'Natural Minor Scales',
    description: 'Natural minor scales in all 12 keys, focusing on smooth finger crossings and maintaining an even tone throughout the range.',
    category: 'Scales',
  },
  {
    id: 'piano-major-arpeggios',
    instrumentId: 'piano',
    title: 'Major Arpeggios',
    description: 'Broken chord arpeggios across two octaves for all major keys. Work on smooth thumb crossings and a relaxed wrist.',
    category: 'Arpeggios',
  },
  {
    id: 'piano-chord-inversions',
    instrumentId: 'piano',
    title: 'Chord Inversions',
    description: 'Root position, first, and second inversions for major and minor triads in all keys. Practice hands separately and together.',
    category: 'Chords',
  },
  {
    id: 'piano-sight-reading',
    instrumentId: 'piano',
    title: 'Sight Reading',
    description: 'Short sight-reading excerpts at various difficulty levels. Read ahead by at least one beat and keep a steady pulse without stopping.',
    category: 'Sight Reading',
  },
]
