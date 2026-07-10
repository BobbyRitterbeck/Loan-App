export interface TypingVelocityMetrics {
  fieldId: string;
  totalKeystrokes: number;
  averageIntervalMs: number | null;
  minIntervalMs: number | null;
  maxIntervalMs: number | null;
  totalInputEvents: number;
  trustedInputEventCount: number;
  untrustedInputEventCount: number;
  inputWithoutKeydownCount: number;
  inputTypeCounts: Record<string, number>;
}
