import { TypingVelocityMetrics } from './typing-velocity.model';

export interface PageSessionMetrics {
  // Time from page session start to end.
  sessionDurationMs: number;
  // Time from page session start to the first tracked interaction (focus/keydown/input); null if none.
  timeToFirstInteractionMs: number | null;
  // Time from page session start to the first actual text input anywhere on the page; null if none.
  timeToFirstInputMs: number | null;
  // Summary of elapsed time between completing one field and beginning the next; null when no transitions occurred.
  averageTimeBetweenFieldsMs: number | null;
  minTimeBetweenFieldsMs: number | null;
  maxTimeBetweenFieldsMs: number | null;
  // Total inactive time: sum of gaps between interactions that exceed the idle threshold.
  totalIdleTimeMs: number;
  // Completed per-field metrics collected during the session.
  fields: TypingVelocityMetrics[];
}
