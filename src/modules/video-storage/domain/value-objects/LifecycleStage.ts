/**
 * LifecycleStage Value Object — Domain Layer
 *
 * Type-safe lifecycle stage with transition validation.
 * Pure TypeScript — no framework imports.
 */

export type LifecycleStage = 'active' | 'archived'

export const LIFECYCLE_STAGES: readonly LifecycleStage[] = ['active', 'archived'] as const

/** Valid transitions: active → archived */
const VALID_TRANSITIONS: Record<LifecycleStage, LifecycleStage[]> = {
  active: ['archived'],
  archived: [],
}

export function isValidTransition(from: LifecycleStage, to: LifecycleStage): boolean {
  return VALID_TRANSITIONS[from].includes(to)
}

export function isLifecycleStage(value: string): value is LifecycleStage {
  return LIFECYCLE_STAGES.includes(value as LifecycleStage)
}
