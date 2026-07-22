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

  // Session metadata accepted from the host to keep the API enterprise-ready.
  // Stored but intentionally NOT included in PageSessionMetrics or reporting yet,
  // so metric collection and reporting behavior stay unchanged this phase.
  private pageId: string | null = null;
  private endReason: string | null = null;

  /** Whether a page session is currently open. */
  isActive(): boolean {
    return this.active;
  }

  /** Starts a new page session, storing optional host-provided metadata. */
  start(pageId?: string): void {
    this.active = true;
    this.completedFields = [];
    this.pageId = pageId ?? null;
    this.endReason = null;
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
   *
   * `reason` is stored as session metadata only; it does not affect the
   * reported PageSessionMetrics.
   */
  end(reason?: string): PageSessionMetrics | null {
    if (!this.active) {
      return null;
    }

    this.endReason = reason ?? null;

    const metrics: PageSessionMetrics = { fields: this.completedFields };

    this.active = false;
    this.completedFields = [];

    return metrics;
  }
}
