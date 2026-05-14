export type ViewName = 'home' | 'practice' | 'exercise-list' | 'exercise-detail' | 'stats' | 'settings'

export interface NavFrame {
  view: ViewName
  params: Record<string, unknown>
}

let stack: NavFrame[] = $state([{ view: 'home', params: {} }])
let direction: 'forward' | 'back' = $state('forward')

export function current(): NavFrame {
  return stack[stack.length - 1]
}

export function navDirection(): 'forward' | 'back' {
  return direction
}

export function navigate(view: ViewName, params: Record<string, unknown> = {}): void {
  direction = 'forward'
  stack = [...stack, { view, params }]
}

export function back(): void {
  if (stack.length <= 1) return
  direction = 'back'
  stack = stack.slice(0, -1)
}
