export interface TypingVelocityMetrics {
  fieldId: string;
  totalKeystrokes: number;
  averageIntervalMs: number | null;
  minIntervalMs: number | null;
  maxIntervalMs: number | null;
}
