export interface TypingVelocityMetrics {
  fieldId: string;
  totalKeystrokes: number;
  averageIntervalMs: number | null;
  minIntervalMs: number | null;
  maxIntervalMs: number | null;

  // HTML input type (e.g. 'text', 'password') so downstream analysis can weight field types differently.
  inputType: string | null;
  // Most frequent InputEvent.inputType (e.g. 'insertText', 'insertFromPaste') summarizing how the field was populated.
  dominantInputType: string | null;
  // Time from focus to the first value change; deliberate autofill/typing take time, scripted fills tend to be near-instant.
  msFromFocusToFirstInput: number | null;
  // Whether any untrusted (script-dispatched) input event was seen; a strong signal of synthetic/automated input.
  hasUntrustedInput: boolean;
  // Whether the field was populated without any preceding keystroke (paste, autofill, or programmatic fill).
  inputWithoutKeydown: boolean;
}
