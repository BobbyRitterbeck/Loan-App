import { Injectable } from '@angular/core';

import { TypingVelocityMetrics } from '../../models/typing-velocity.model';

interface FieldVelocityState {
  totalKeystrokes: number;
  lastKeydownTimeStamp: number | null;
  intervalCount: number;
  intervalSumMs: number;
  minIntervalMs: number | null;
  maxIntervalMs: number | null;
  totalInputEvents: number;
  trustedInputEventCount: number;
  untrustedInputEventCount: number;
  inputWithoutKeydownCount: number;
  inputTypeCounts: Record<string, number>;
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

  /** Records a browser input sample to preserve non-typing interaction signals. */
  trackInput(fieldId: string, inputType: string | null, isTrusted: boolean): void {
    if (!fieldId.trim()) {
      return;
    }

    const state = this.fieldStates.get(fieldId) ?? this.createFieldState();

    state.totalInputEvents += 1;

    if (isTrusted) {
      state.trustedInputEventCount += 1;
    } else {
      state.untrustedInputEventCount += 1;
    }

    if (state.totalKeystrokes === 0) {
      state.inputWithoutKeydownCount += 1;
    }

    const normalizedInputType = inputType?.trim() || 'unknown';
    state.inputTypeCounts[normalizedInputType] =
      (state.inputTypeCounts[normalizedInputType] ?? 0) + 1;

    this.fieldStates.set(fieldId, state);
  }

  /** Completes a field session and returns summary typing velocity metrics. */
  completeSession(fieldId: string): TypingVelocityMetrics | null {
    const state = this.fieldStates.get(fieldId);
    if (!state) {
      return null;
    }

    // Session is single-use: once reported, a new keystroke starts a fresh session.
    this.fieldStates.delete(fieldId);

    return {
      fieldId,
      totalKeystrokes: state.totalKeystrokes,
      averageIntervalMs:
        state.intervalCount > 0 ? state.intervalSumMs / state.intervalCount : null,
      minIntervalMs: state.minIntervalMs,
      maxIntervalMs: state.maxIntervalMs,
      totalInputEvents: state.totalInputEvents,
      trustedInputEventCount: state.trustedInputEventCount,
      untrustedInputEventCount: state.untrustedInputEventCount,
      inputWithoutKeydownCount: state.inputWithoutKeydownCount,
      inputTypeCounts: { ...state.inputTypeCounts },
    };
  }

  private createFieldState(): FieldVelocityState {
    return {
      totalKeystrokes: 0,
      lastKeydownTimeStamp: null,
      intervalCount: 0,
      intervalSumMs: 0,
      minIntervalMs: null,
      maxIntervalMs: null,
      totalInputEvents: 0,
      trustedInputEventCount: 0,
      untrustedInputEventCount: 0,
      inputWithoutKeydownCount: 0,
      inputTypeCounts: {},
    };
  }
}
