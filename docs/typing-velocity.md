# Typing Velocity Tracking Architecture

## Purpose

This feature measures basic typing velocity for tracked input fields and produces summary metrics that can later be reported by a production keystroke-tracking service.

The current sandbox (POC) displays completed sessions in a collapsible panel on the login page. The architecture intentionally separates event orchestration, measurement, and reporting so production integration can replace only the reporting step and delete the POC UI bits.

All typing-velocity services live under `src/app/services/TS-services/`.

## File Responsibilities

Files are listed in execution order (startup → runtime).

- `src/app/app.ts`
  - Initializes `KeystrokeTrackingService` once at app startup.
- `src/app/services/TS-services/keystroke-tracking.service.ts`
  - Owns global browser event listeners (`focus`, `keydown`, `input`, `blur`) and orchestration.
  - Filters relevant input elements.
  - Receives completed typing metrics and passes them to the reporting seam (`reportTypingVelocity`).
  - POC-only: owns `sessionMetrics` for the login metrics panel (remove at enterprise cutover).
- `src/app/pages/login/login.component.*`
  - POC-only: renders the metrics panel from `sessionMetrics` (remove the panel, inject, and `.metrics-*` styles at cutover).
- `src/app/services/TS-services/keystroke-tracking-utils.ts`
  - Shared helpers for tracked-input detection and field identification.
- `src/app/services/TS-services/keystroke-tracking.constants.ts`
  - Shared tracked input-type constants.
- `src/app/services/TS-services/typing-velocity.service.ts`
  - Performs typing velocity measurement.
  - Keeps field-level measurement state.
  - Produces `TypingVelocityMetrics` when a field session completes.
- `src/app/models/typing-velocity.model.ts`
  - Defines the output contract consumed by reporting (`TypingVelocityMetrics`).

## Why Each File Exists

### `src/app/app.ts`

Something must turn tracking on once when the app loads. Calling `initialize()` from the root component keeps that a single, explicit bootstrap step. Form components and inputs stay unaware of tracking—no per-field wiring required.

### `src/app/services/TS-services/keystroke-tracking.service.ts`

Browser events are a global, cross-cutting concern. One service owns `document`-level listeners so listeners are not duplicated on every input or component. It sits between "what happened in the DOM" and "what we measure/report," so measurement and reporting can be swapped without touching event wiring.

Capture-phase registration (`addEventListener(..., true)`) mirrors how a production keystroke-tracking service would run: tracking still fires even if a component stops propagation on its own handlers.

### `src/app/services/TS-services/keystroke-tracking-utils.ts`

"Is this input trackable?" and "What field is this?" are pure logic with no state or side effects. Extracting that from the orchestrator keeps the service focused on listeners and delegation, and makes the rules easy to test and reuse if other keystroke trackers need the same filtering.

### `src/app/services/TS-services/keystroke-tracking.constants.ts`

The list of tracked input types is a policy decision, not an implementation detail. A dedicated constants file means you change what gets tracked in one place without hunting through listener code. It also provides a single typed source (`as const`) that utils can reference safely.

### `src/app/services/TS-services/typing-velocity.service.ts`

Velocity math and per-field session state are separate from DOM events. This service can count keystrokes, ignore key repeat, and compute intervals without knowing about `keydown`, `blur`, or `console.log`. That separation matters for production: the keystroke-tracking service keeps listeners; this service remains the reusable measurement engine.

Session state lives here (not in the orchestrator) so multiple fields can be tracked concurrently via `fieldId`, and each session resets cleanly on blur. Raw input accumulators are kept internal to this service and folded into derived behavioral metrics on completion (dominant input type, focus-to-first-input delay, presence of untrusted input, and input-without-keydown) so downstream analysis can distinguish typing, paste, autofill, and scripted input without exposing raw counters or adding scoring logic in the tracking layer.

### `src/app/models/typing-velocity.model.ts`

Measurement and reporting need a shared contract. The interface defines the shape of completed metrics so `TypingVelocityService` knows what to return and `KeystrokeTrackingService` (and later enterprise reporting) knows what to consume—without coupling those layers through ad-hoc objects that drift apart as the feature grows.

## Event Flow

Browser Events
→ `KeystrokeTrackingService` global listeners
→ tracked-input filtering (`keystroke-tracking-utils` + `keystroke-tracking.constants`)
→ `TypingVelocityService` measurement updates
→ `TypingVelocityMetrics`
→ reporting seam (`reportTypingVelocity`; POC body appends to `sessionMetrics`)

## Session Lifecycle

- Session begins implicitly on first tracked `focus`, `keydown`, or `input` for a field.
- Tracked `focus` anchors focus-relative timing (focus→first input, focus→fully populated) and baselines value length.
- Tracked `input` events update internal accumulators used to derive input/autofill behavioral metrics on completion.
- Additional `keydown` events update interval summaries.
- Session ends on tracked input `blur`.
- On session end, `TypingVelocityService.completeSession(fieldId)` returns summary metrics.
- Sessions with no recorded activity (focused but never typed in or changed) are treated as empty and are not reported.

## Why Responsibilities Are Separated

| Concern | Where it lives | Why separated |
| --- | --- | --- |
| When to listen | `app.ts` + `keystroke-tracking.service.ts` | One startup hook, one listener owner |
| What to track | `keystroke-tracking.constants.ts` + `keystroke-tracking-utils.ts` | Policy vs. pure helpers |
| How to measure | `typing-velocity.service.ts` | Reusable, DOM-free math |
| What to emit | `typing-velocity.model.ts` | Stable contract between layers |
| Where to send it | `reportTypingVelocity()` in orchestrator | POC: `sessionMetrics` UI; production: swap only this |

- Browser event ownership and filtering are orchestration concerns.
- Velocity calculation is a measurement concern.
- Reporting is an integration concern.

This separation minimizes coupling and makes it easier to replace the POC reporting body with production reporting (for example, `reportTypingVelocity(...)`) without changing measurement logic.

Without this structure you would duplicate "is this a tracked input?" logic, tie velocity math to DOM events, and couple reporting to implicit object shapes—each of which makes production integration harder.

## Production Integration Path

To integrate this feature into a real application:

1. Keep listener registration and filtering in `KeystrokeTrackingService`.
2. Reuse `TypingVelocityService` for measurement and `TypingVelocityMetrics` as the payload contract.
3. Follow **Replace and Remove Checklist** below for the POC reporting/UI cutover.

No metric recalculation logic needs to move into the keystroke-tracking service.

## Replace and Remove Checklist

Line numbers below match the sandbox as of this writing. Prefer searching for `POC-only` if files have drifted.

### Replace (keep the method; change only the body)

| File | Lines | Action |
| --- | --- | --- |
| `src/app/services/TS-services/keystroke-tracking.service.ts` | `103–105` (`reportTypingVelocity`) | Keep the method. Replace the body so it publishes `metrics` to the enterprise event/reporting API instead of appending to `sessionMetrics`. |

Current POC body to replace:

```ts
private reportTypingVelocity(metrics: TypingVelocityMetrics): void {
  this.sessionMetrics.update((sessions) => [metrics, ...sessions]);
}
```

### Remove (POC-only; delete entirely)

| File | Lines | What to delete |
| --- | --- | --- |
| `src/app/services/TS-services/keystroke-tracking.service.ts` | `17–21` | `sessionMetrics` signal and its POC comment. Also drop `signal` from the `@angular/core` import if it becomes unused. |
| `src/app/pages/login/login.component.ts` | `1` | `JsonPipe` import. |
| `src/app/pages/login/login.component.ts` | `5–6` | `KeystrokeTrackingService` import and its POC comment. |
| `src/app/pages/login/login.component.ts` | `15` | `imports: [JsonPipe]` (or remove `JsonPipe` from `imports` if other imports remain). |
| `src/app/pages/login/login.component.ts` | `23–24` | `keystrokeTrackingService` inject. |
| `src/app/pages/login/login.component.ts` | `29–31` | `typingVelocitySessions` and `sessionCount`. |
| `src/app/pages/login/login.component.html` | `77–103` | Metrics panel (`details.metrics-card` block). |
| `src/app/pages/login/login.component.scss` | `64–149` | All `.metrics-*` styles. |

After those edits, `KeystrokeTrackingService` should again be orchestration-only (listeners → measurement → `reportTypingVelocity`), and the login page should have no dependency on keystroke tracking.
