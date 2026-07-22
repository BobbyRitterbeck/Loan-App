import { TypingVelocityMetrics } from './typing-velocity.model';

/**
 * Aggregated output of a single page session: the completed field metrics
 * gathered between beginPageSession and endPageSession.
 *
 * Intentionally minimal for this phase (lifecycle only). This wrapper is the
 * stable extension point where later phases can add page-level aggregates
 * without changing the reporting seam signature.
 */
export interface PageSessionMetrics {
  fields: TypingVelocityMetrics[];
}
