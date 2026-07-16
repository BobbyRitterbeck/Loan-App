import { Injectable } from '@angular/core';

import { TypingVelocityMetrics } from '../../models/typing-velocity.model';

interface FieldVelocityState {
  // Typing velocity accumulators.
  totalKeystrokes: number;
  lastKeydownTimeStamp: number | null;
  intervalCount: number;
  intervalSumMs: number;
  minIntervalMs: number | null;
  maxIntervalMs: number | null;
  // Internal input/autofill accumulators used only to derive behavioral metrics.
  hasUntrustedInput: boolean;
  inputWithoutKeydown: boolean;
  inputTypeCounts: Record<string, number>;
  htmlInputType: string | null;
  focusTimeStamp: number | null;
  firstInputTimeStamp: number | null;
}

@Injectable({ providedIn: 'root' })
export class TypingVelocityService {
  private readonly fieldStates = new Map<string, FieldVelocityState>();

  /** Records a keydown sample for a field to update interval metrics. */
  trackKeydown(fieldId: string, timeStamp: number, repeat: boolean): void {
    // Ignore held-key auto-repeat so metrics represent intentional keystrokes.
    if (!fieldId.trim() || repeat) {
      return;
    }

    const state = this.fieldStates.get(fieldId) ?? this.createFieldState();

    state.totalKeystrokes += 1;

    if (state.lastKeydownTimeStamp !== null) {
      const intervalMs = timeStamp - state.lastKeydownTimeStamp;
      if (intervalMs >= 0) {
        // Negative values can occur from unusual browser timing anomalies.
        state.intervalCount += 1;
        state.intervalSumMs += intervalMs;
        state.minIntervalMs = Math.min(state.minIntervalMs ?? intervalMs, intervalMs);
        state.maxIntervalMs = Math.max(state.maxIntervalMs ?? intervalMs, intervalMs);
      }
    }

    state.lastKeydownTimeStamp = timeStamp;
    this.fieldStates.set(fieldId, state);
  }

  /** Records a field gaining focus to anchor focus-relative timing metrics. */
  trackFocus(fieldId: string, timeStamp: number, htmlInputType: string): void {
    if (!fieldId.trim()) {
      return;
    }

    const state = this.fieldStates.get(fieldId) ?? this.createFieldState();

    // Focus marks the start of an interaction; all focus-relative timings baseline here.
    if (state.focusTimeStamp === null) {
      state.focusTimeStamp = timeStamp;
    }

    if (state.htmlInputType === null) {
      state.htmlInputType = htmlInputType;
    }

    this.fieldStates.set(fieldId, state);
  }

  /** Records a browser input sample to preserve non-typing interaction signals. */
  trackInput(
    fieldId: string,
    inputType: string | null,
    isTrusted: boolean,
    timeStamp: number,
    htmlInputType: string,
  ): void {
    if (!fieldId.trim()) {
      return;
    }

    const state = this.fieldStates.get(fieldId) ?? this.createFieldState();

    // Untrusted events are script-dispatched; a single occurrence is a meaningful signal.
    if (!isTrusted) {
      state.hasUntrustedInput = true;
    }

    // A value change with no prior keystroke indicates paste, autofill, or programmatic fill.
    if (state.totalKeystrokes === 0) {
      state.inputWithoutKeydown = true;
    }

    const normalizedInputType = inputType?.trim() || 'unknown';
    state.inputTypeCounts[normalizedInputType] =
      (state.inputTypeCounts[normalizedInputType] ?? 0) + 1;

    // First input approximates when population begins, anchoring the focus-to-first-input delay.
    if (state.firstInputTimeStamp === null) {
      state.firstInputTimeStamp = timeStamp;
    }

    if (state.htmlInputType === null) {
      state.htmlInputType = htmlInputType;
    }

    this.fieldStates.set(fieldId, state);
  }

  /**
   * Completes a field session and returns summary typing velocity metrics.
   * Returns null when there is no session or when the session recorded no activity.
   */
  completeSession(fieldId: string): TypingVelocityMetrics | null {
    const state = this.fieldStates.get(fieldId);
    if (!state) {
      return null;
    }

    // Session is single-use: once reported, a new keystroke starts a fresh session.
    this.fieldStates.delete(fieldId);

    // Focus-only sessions carry no behavioral signal; skip reporting them.
    if (this.isEmptySession(state)) {
      return null;
    }

    // Focus should precede input; negative spans imply clock anomalies and are reported as null.
    const msFromFocusToFirstInput = this.nonNegativeSpan(
      state.focusTimeStamp,
      state.firstInputTimeStamp,
    );

    return {
      fieldId,
      totalKeystrokes: state.totalKeystrokes,
      averageIntervalMs:
        state.intervalCount > 0 ? state.intervalSumMs / state.intervalCount : null,
      minIntervalMs: state.minIntervalMs,
      maxIntervalMs: state.maxIntervalMs,
      inputType: state.htmlInputType,
      dominantInputType: this.resolveDominantInputType(state.inputTypeCounts),
      msFromFocusToFirstInput,
      hasUntrustedInput: state.hasUntrustedInput,
      inputWithoutKeydown: state.inputWithoutKeydown,
    };
  }

  /** True when the field was focused but never typed in or changed (no keydown, no input event). */
  private isEmptySession(state: FieldVelocityState): boolean {
    return (
      state.totalKeystrokes === 0 &&
      state.firstInputTimeStamp === null &&
      state.hasUntrustedInput === false &&
      state.inputWithoutKeydown === false
    );
  }

  /** Returns end - start when both are present and non-negative, otherwise null. */
  private nonNegativeSpan(start: number | null, end: number | null): number | null {
    if (start === null || end === null) {
      return null;
    }
    const span = end - start;
    return span >= 0 ? span : null;
  }

  /** Returns the most frequently observed InputEvent.inputType, or null when none was recorded. */
  private resolveDominantInputType(counts: Record<string, number>): string | null {
    let dominantType: string | null = null;
    let highestCount = 0;
    for (const [type, count] of Object.entries(counts)) {
      if (count > highestCount) {
        highestCount = count;
        dominantType = type;
      }
    }
    return dominantType;
  }

  private createFieldState(): FieldVelocityState {
    return {
      totalKeystrokes: 0,
      lastKeydownTimeStamp: null,
      intervalCount: 0,
      intervalSumMs: 0,
      minIntervalMs: null,
      maxIntervalMs: null,
      hasUntrustedInput: false,
      inputWithoutKeydown: false,
      inputTypeCounts: {},
      htmlInputType: null,
      focusTimeStamp: null,
      firstInputTimeStamp: null,
    };
  }
}
