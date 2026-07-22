import { TypingVelocityMetrics } from './typing-velocity.model';

/**
 * Aggregated output of a single page session: page-level behavioral metrics
 * plus the completed field metrics gathered between startPageSession and
 * endPageSession.
 *
 * Page-level metrics describe behavior across the whole page and are distinct
 * from (never duplicates of) the per-field metrics in `fields`.
 */
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
