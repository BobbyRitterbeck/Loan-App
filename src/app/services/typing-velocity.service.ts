import { Injectable } from '@angular/core';

import { TypingVelocityMetrics } from '../models/typing-velocity.model';

interface FieldVelocityState {
  totalKeystrokes: number;
  lastKeydownTimeStamp: number | null;
  intervalCount: number;
  intervalSumMs: number;
  minIntervalMs: number | null;
  maxIntervalMs: number | null;
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
    };
  }
}
