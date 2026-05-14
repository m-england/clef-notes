import type { ExerciseDefinition } from '../registry'

export const voiceExercises: ExerciseDefinition[] = [
  {
    id: 'voice-lip-trills',
    instrumentId: 'voice',
    title: 'Lip Trills',
    description: 'Warm up the voice with lip trills, sliding smoothly through comfortable pitch ranges. Keep the face relaxed and the airflow steady.',
    category: 'Warmup',
  },
  {
    id: 'voice-five-note-scale',
    instrumentId: 'voice',
    title: 'Five-Note Scale',
    description: 'Ascending and descending five-note patterns on various vowels (ah, ee, oh). Focus on consistent tone and smooth legato connection.',
    category: 'Scales',
  },
  {
    id: 'voice-octave-slides',
    instrumentId: 'voice',
    title: 'Octave Slides',
    description: 'Smooth portamento slides across an octave to develop range and register connection. Move slowly and avoid any tension in the throat.',
    category: 'Range',
  },
  {
    id: 'voice-messa-di-voce',
    instrumentId: 'voice',
    title: 'Messa di Voce',
    description: 'Sustain a single pitch with a gentle crescendo then decrescendo on one vowel. A classic exercise for breath control and dynamic range.',
    category: 'Dynamics',
  },
  {
    id: 'voice-staccato',
    instrumentId: 'voice',
    title: 'Staccato Exercise',
    description: 'Bright, detached notes ascending the scale to build agility and clean articulation. Keep each note short and use a light, supported breath impulse.',
    category: 'Agility',
  },
]
