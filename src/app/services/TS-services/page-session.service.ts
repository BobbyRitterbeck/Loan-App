import { Injectable } from '@angular/core';

import { PageSessionMetrics } from '../../models/page-session.model';
import { TypingVelocityMetrics } from '../../models/typing-velocity.model';

// Minimum gap (ms) between tracked interactions for that gap to count as idle
// time. Policy/extension point for the page-session behavior model.
const IDLE_THRESHOLD_MS = 2000;

/**
 * Owns the page-session lifecycle and aggregates page-level behavioral metrics
 * plus already-computed field metrics.
 *
 * This service performs no measurement of individual fields and no DOM work; it
 * receives primitive timing signals and completed TypingVelocityMetrics from the
 * orchestrator and returns a PageSessionMetrics batch when the session ends.
 *
 * All timestamps passed in share the performance timeline (performance.now() /
 * event.timeStamp) so spans are directly comparable.
 */
@Injectable({ providedIn: 'root' })
export class PageSessionService {
  private active = false;
  private completedFields: TypingVelocityMetrics[] = [];

  // Session metadata accepted from the host to keep the API enterprise-ready.
  // Stored but intentionally NOT included in PageSessionMetrics or reporting yet.
  private pageId: string | null = null;
  private endReason: string | null = null;

  // Page-level behavioral timing state.
  private startTimeStamp = 0;
  private firstInteractionTimeStamp: number | null = null;
  private firstInputTimeStamp: number | null = null;
  private lastInteractionTimeStamp: number | null = null;
  private totalIdleTimeMs = 0;

  // Field-to-field transition accumulators (summary only; no per-transition storage).
  private pendingFieldEndTimeStamp: number | null = null;
  private pendingFieldId: string | null = null;
  private transitionCount = 0;
  private transitionSumMs = 0;
  private transitionMinMs: number | null = null;
  private transitionMaxMs: number | null = null;

  /** Whether a page session is currently open. */
  isActive(): boolean {
    return this.active;
  }

  /** Starts a new page session, resetting all state and storing optional metadata. */
  start(startTimeStamp: number, pageId?: string): void {
    this.active = true;
    this.completedFields = [];
    this.pageId = pageId ?? null;
    this.endReason = null;

    this.startTimeStamp = startTimeStamp;
    this.firstInteractionTimeStamp = null;
    this.firstInputTimeStamp = null;
    this.lastInteractionTimeStamp = null;
    this.totalIdleTimeMs = 0;

    this.pendingFieldEndTimeStamp = null;
    this.pendingFieldId = null;
    this.transitionCount = 0;
    this.transitionSumMs = 0;
    this.transitionMinMs = null;
    this.transitionMaxMs = null;
  }

  /** Collects a completed field's metrics into the active page session. */
  addFieldMetrics(metrics: TypingVelocityMetrics): void {
    if (!this.active) {
      return;
    }

    this.completedFields.push(metrics);
  }

  /**
   * Records a tracked interaction (focus/keydown/input). Drives first-interaction
   * timing and idle-time accumulation.
   */
  recordInteraction(timeStamp: number): void {
    if (!this.active) {
      return;
    }

    if (this.firstInteractionTimeStamp === null) {
      this.firstInteractionTimeStamp = timeStamp;
    }

    if (this.lastInteractionTimeStamp !== null) {
      const gap = timeStamp - this.lastInteractionTimeStamp;
      // A long gap with no tracked interaction is idle time.
      if (gap > IDLE_THRESHOLD_MS) {
        this.totalIdleTimeMs += gap;
      }
    }

    this.lastInteractionTimeStamp = timeStamp;
  }

  /** Records the first actual text input anywhere on the page (recorded once). */
  recordInput(timeStamp: number): void {
    if (!this.active) {
      return;
    }

    if (this.firstInputTimeStamp === null) {
      this.firstInputTimeStamp = timeStamp;
    }
  }

  /**
   * Records a field beginning interaction (focus). Closes a field-to-field
   * transition opened by a prior field completion on a different field.
   */
  recordFieldFocus(fieldId: string, timeStamp: number): void {
    if (!this.active) {
      return;
    }

    if (this.pendingFieldEndTimeStamp !== null && fieldId !== this.pendingFieldId) {
      const delta = timeStamp - this.pendingFieldEndTimeStamp;
      if (delta >= 0) {
        this.transitionCount += 1;
        this.transitionSumMs += delta;
        this.transitionMinMs = Math.min(this.transitionMinMs ?? delta, delta);
        this.transitionMaxMs = Math.max(this.transitionMaxMs ?? delta, delta);
      }

      this.pendingFieldEndTimeStamp = null;
      this.pendingFieldId = null;
    }
  }

  /**
   * Records a field completing (blur). Opens a potential field-to-field
   * transition that the next focus on a different field will close.
   */
  recordFieldCompletion(fieldId: string, timeStamp: number): void {
    if (!this.active) {
      return;
    }

    this.pendingFieldEndTimeStamp = timeStamp;
    this.pendingFieldId = fieldId;
  }

  /**
   * Ends the active page session and returns its aggregated metrics.
   * Returns null when no session is active so callers can stay idempotent.
   *
   * `reason` is stored as session metadata only; it does not affect the
   * reported PageSessionMetrics.
   */
  end(endTimeStamp: number, reason?: string): PageSessionMetrics | null {
    if (!this.active) {
      return null;
    }

    this.endReason = reason ?? null;

    const metrics: PageSessionMetrics = {
      sessionDurationMs: this.nonNegativeSpan(this.startTimeStamp, endTimeStamp) ?? 0,
      timeToFirstInteractionMs: this.nonNegativeSpan(
        this.startTimeStamp,
        this.firstInteractionTimeStamp,
      ),
      timeToFirstInputMs: this.nonNegativeSpan(this.startTimeStamp, this.firstInputTimeStamp),
      averageTimeBetweenFieldsMs:
        this.transitionCount > 0 ? this.transitionSumMs / this.transitionCount : null,
      minTimeBetweenFieldsMs: this.transitionMinMs,
      maxTimeBetweenFieldsMs: this.transitionMaxMs,
      totalIdleTimeMs: this.totalIdleTimeMs,
      fields: this.completedFields,
    };

    this.active = false;
    this.completedFields = [];

    return metrics;
  }

  /** Returns end - start when both are present and non-negative, otherwise null. */
  private nonNegativeSpan(start: number, end: number | null): number | null {
    if (end === null) {
      return null;
    }

    const span = end - start;
    return span >= 0 ? span : null;
  }
}
