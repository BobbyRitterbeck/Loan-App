/** Mirrors `TypingVelocityMetrics` from the app for Cypress assertions. */
export interface TypingVelocityMetrics {
  fieldId: string;
  totalKeystrokes: number;
  averageIntervalMs: number | null;
  minIntervalMs: number | null;
  maxIntervalMs: number | null;
  inputType: string | null;
  dominantInputType: string | null;
  msFromFocusToFirstInput: number | null;
  hasUntrustedInput: boolean;
  inputWithoutKeydown: boolean;
}

/** Mirrors `PageSessionMetrics` from the app for Cypress assertions. */
export interface PageSessionMetrics {
  sessionDurationMs: number;
  timeToFirstInteractionMs: number | null;
  timeToFirstInputMs: number | null;
  averageTimeBetweenFieldsMs: number | null;
  minTimeBetweenFieldsMs: number | null;
  maxTimeBetweenFieldsMs: number | null;
  totalIdleTimeMs: number;
  fields: TypingVelocityMetrics[];
}
