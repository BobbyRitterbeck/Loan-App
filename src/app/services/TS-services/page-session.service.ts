import { Injectable } from '@angular/core';

import { PageSessionMetrics } from '../../models/page-session.model';
import { TypingVelocityMetrics } from '../../models/typing-velocity.model';

/**
 * Owns the page-session lifecycle and aggregates already-computed field metrics.
 *
 * This service performs no measurement and no DOM work; it only collects the
 * TypingVelocityMetrics handed to it during an active session and returns them
 * as a batch when the session ends.
 */
@Injectable({ providedIn: 'root' })
export class PageSessionService {
  private active = false;
  private completedFields: TypingVelocityMetrics[] = [];

  /** Starts a new page session, discarding any state from a prior session. */
  begin(): void {
    this.active = true;
    this.completedFields = [];
  }

  /** Collects a completed field's metrics into the active page session. */
  addFieldMetrics(metrics: TypingVelocityMetrics): void {
    if (!this.active) {
      return;
    }

    this.completedFields.push(metrics);
  }

  /**
   * Ends the active page session and returns its aggregated field metrics.
   * Returns null when no session is active so callers can stay idempotent.
   */
  end(): PageSessionMetrics | null {
    if (!this.active) {
      return null;
    }

    const metrics: PageSessionMetrics = { fields: this.completedFields };

    this.active = false;
    this.completedFields = [];

    return metrics;
  }
}
