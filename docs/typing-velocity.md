# Typing Velocity Tracking Architecture

## Purpose

This feature measures basic typing velocity for tracked input fields and produces summary metrics that can later be reported by a production keystroke-tracking service.

Completed field metrics are collected into a page session and emitted as a single `PageSessionMetrics` report when the page session ends. The architecture intentionally separates event orchestration, measurement, and reporting so production integration can replace only the reporting step.

All typing-velocity services live under `src/app/services/TS-services/`.

## File Responsibilities

Files are listed in execution order (startup → runtime).

- `src/app/app.ts`
  - Initializes `KeystrokeTrackingService` once at app startup.
  - Provides `onHostNavigation()` — the example host seam showing where an app drives the page-session lifecycle on route transitions (not wired to any router).
- `src/app/services/TS-services/keystroke-tracking.service.ts`
  - Owns global browser event listeners (`focus`, `keydown`, `input`, `blur`) and orchestration.
  - Filters relevant input elements.
  - Collects each completed field's metrics into the active page session (`PageSessionService.addFieldMetrics`); it does not report per field.
  - Exposes the public page-session lifecycle (`startPageSession(pageId?)`, `endPageSession(reason?)`), enforces no-overlap on start and idempotency on end, and forwards the completed page session to the single reporting seam (`reportPageSession`).
  - Registers a `pagehide` listener as a fallback end trigger for document teardown (safety net; the host normally drives the lifecycle explicitly).
- `src/app/services/TS-services/page-session.service.ts`
  - Owns the page-session lifecycle (`start`, `end`, `isActive`) and aggregates completed `TypingVelocityMetrics` into a `PageSessionMetrics` batch.
  - Computes page-level behavioral metrics (session duration, time-to-first-interaction/input, field-transition summary, idle time) from primitive timing signals fed by the orchestrator (`recordInteraction`, `recordInput`, `recordFieldFocus`, `recordFieldCompletion`).
  - Stores host-provided `pageId`/`reason` as session metadata (reserved for future reporting; not emitted yet).
  - Performs no per-field measurement and no DOM work.
- `src/app/services/TS-services/keystroke-tracking-utils.ts`
  - Shared helpers for tracked-input detection and field identification.
- `src/app/services/TS-services/keystroke-tracking.constants.ts`
  - Shared tracked input-type constants.
- `src/app/services/TS-services/typing-velocity.service.ts`
  - Performs typing velocity measurement.
  - Keeps field-level measurement state.
  - Produces `TypingVelocityMetrics` when a field session completes (one field via `completeSession`, or all open fields via `completeAllSessions`).
- `src/app/models/typing-velocity.model.ts`
  - Defines the output contract consumed by reporting (`TypingVelocityMetrics`).
- `src/app/models/page-session.model.ts`
  - Defines the page-session output contract (`PageSessionMetrics`): page-level behavioral metrics plus the field metrics collected during the session.

## Why Each File Exists

### `src/app/app.ts`

Something must turn tracking on once when the app loads. Calling `initialize()` from the root component keeps that a single, explicit bootstrap step. Form components and inputs stay unaware of tracking—no per-field wiring required.

`App` also carries `onHostNavigation()`, an example-only seam showing where a host drives the page-session lifecycle on navigation. It is deliberately not tied to a router: a real app calls it from Angular Router `NavigationEnd`, a React Router effect, or any other navigation signal. The tracking module itself never imports a router, so this seam is the only per-framework change.

### `src/app/services/TS-services/keystroke-tracking.service.ts`

Browser events are a global, cross-cutting concern. One service owns `document`-level listeners so listeners are not duplicated on every input or component. It sits between "what happened in the DOM" and "what we measure/report," so measurement and reporting can be swapped without touching event wiring.

Capture-phase registration (`addEventListener(..., true)`) mirrors how a production keystroke-tracking service would run: tracking still fires even if a component stops propagation on its own handlers.

### `src/app/services/TS-services/keystroke-tracking-utils.ts`

"Is this input trackable?" and "What field is this?" are pure logic with no state or side effects. Extracting that from the orchestrator keeps the service focused on listeners and delegation, and makes the rules easy to test and reuse if other keystroke trackers need the same filtering.

### `src/app/services/TS-services/keystroke-tracking.constants.ts`

The list of tracked input types is a policy decision, not an implementation detail. A dedicated constants file means you change what gets tracked in one place without hunting through listener code. It also provides a single typed source (`as const`) that utils can reference safely.

### `src/app/services/TS-services/typing-velocity.service.ts`

Velocity math and per-field session state are separate from DOM events. This service can count keystrokes, ignore key repeat, and compute intervals without knowing about `keydown`, `blur`, or `console.log`. That separation matters for production: the keystroke-tracking service keeps listeners; this service remains the reusable measurement engine.

Field measurement state lives here (not in the orchestrator) so multiple fields can be tracked concurrently via `fieldId`, and each session resets cleanly on blur. Raw input accumulators are kept internal to this service and folded into derived behavioral metrics on completion (dominant input type, focus-to-first-input delay, presence of untrusted input, and input-without-keydown) so downstream analysis can distinguish typing, paste, autofill, and scripted input without exposing raw counters or adding scoring logic in the tracking layer.

This service is deliberately **field-scoped**. Page-level session state lives in `page-session.service.ts` so field measurement and page aggregation have separate reasons to change.

### `src/app/services/TS-services/page-session.service.ts`

A page session is a different granularity than a field session: it spans many fields and has an explicit begin/end lifecycle driven by the host, whereas a field session is implicit (focus → blur). Keeping page-session state and aggregation out of `TypingVelocityService` preserves that service's single responsibility (field math) and out of `KeystrokeTrackingService` keeps session state off the DOM/orchestration layer, consistent with the rest of this architecture.

It collects the `TypingVelocityMetrics` handed to it between `start()` and `end()`, and computes page-level behavioral metrics from primitive timing signals fed by the orchestrator (see "Page Session Metrics"). It keeps only summary accumulators — no arrays of raw transitions or interaction timelines — so state stays small. It also stores the host-provided `pageId`/`reason` as session metadata so the lifecycle API is enterprise-ready, though that metadata is not emitted yet. `PageSessionMetrics` is the extension point where later phases add page-level metrics without changing the reporting seam.

### `src/app/models/typing-velocity.model.ts`

Measurement and reporting need a shared contract. The interface defines the shape of completed metrics so `TypingVelocityService` knows what to return and `KeystrokeTrackingService` (and later enterprise reporting) knows what to consume—without coupling those layers through ad-hoc objects that drift apart as the feature grows.

## Event Flow

During the page session (collect only, no reporting):

Browser Events
→ `KeystrokeTrackingService` global listeners
→ tracked-input filtering (`keystroke-tracking-utils` + `keystroke-tracking.constants`)
→ `TypingVelocityService` measurement updates (per-field)
→ page-level timing signals to `PageSessionService` (`recordInteraction` on focus/keydown/input, `recordInput` on input, `recordFieldFocus` on focus, `recordFieldCompletion` on blur)
→ on `blur`, `TypingVelocityService.completeSession(fieldId)` → `TypingVelocityMetrics`
→ collected into the active page session (`PageSessionService.addFieldMetrics`)

On page session end (single report):

`KeystrokeTrackingService.endPageSession()`
→ flush open fields (`TypingVelocityService.completeAllSessions`) → collected via `addFieldMetrics`
→ `PageSessionService.end()` → `PageSessionMetrics`
→ single reporting seam (`reportPageSession`)

## Field Session Lifecycle

- Session begins implicitly on first tracked `focus`, `keydown`, or `input` for a field.
- Tracked `focus` anchors focus-relative timing (focus→first input, focus→fully populated) and baselines value length.
- Tracked `input` events update internal accumulators used to derive input/autofill behavioral metrics on completion.
- Additional `keydown` events update interval summaries.
- Session ends on tracked input `blur`, or when the page session ends while the field is still open.
- On session end, `TypingVelocityService.completeSession(fieldId)` returns summary metrics, which the orchestrator collects into the active page session (it is not reported on its own).
- Sessions with no recorded activity (focused but never typed in or changed) are treated as empty and are not collected.

## Page Session Lifecycle

The keystroke module never decides what a "page" is; it responds to lifecycle calls from the host application. `KeystrokeTrackingService` exposes two public methods:

- `startPageSession(pageId?: string)` — starts a page session. The host calls this on page/route enter. `pageId` is stored as session metadata.
- `endPageSession(reason?: string)` — flushes any still-open field sessions, aggregates all completed `TypingVelocityMetrics` collected during the session into a `PageSessionMetrics`, and forwards it to `reportPageSession`. The host calls this on page/route leave. `reason` is stored as session metadata.

The host owns the boundaries. A SPA route transition ends the current session and starts the next — without any dependency on browser unload events:

```ts
// Example host seam (see App.onHostNavigation); wire to your router.
keystrokeTracking.endPageSession('navigation');
keystrokeTracking.startPageSession(nextPageId);
```

Lifecycle rules:

- **No overlap.** Calling `startPageSession()` while a session is already active is an invalid lifecycle call: the current session is left untouched, the request is ignored, and a development `console.warn` is emitted. The host must call `endPageSession()` before starting a new session.
- **Idempotent end.** `endPageSession()` with no active session is a no-op. This is what lets `pagehide` act as a safe fallback: if the host already ended the session, the fallback does nothing rather than reporting twice.
- **`pagehide` is a fallback only**, not the primary trigger. It flushes and reports the active session if the document is torn down (tab close, refresh, external navigation) before the host calls `endPageSession()`. It is not tied to in-app navigation.

Metadata and reporting:

- `pageId` and `reason` are accepted and stored as session metadata to keep the API enterprise-ready, but they are **not** included in `PageSessionMetrics` or the console report this phase. Metric collection and reporting behavior are unchanged.
- There is a single reporting path: `reportPageSession`. Completed field metrics are collected on `blur` but not reported individually; they are emitted together in the page session's `PageSessionMetrics`.
- A page session with no field activity still emits a `PageSessionMetrics` with an empty `fields` array; nothing is silently dropped.

Framework independence:

- The module never imports Angular Router, React Router, or any routing library. The only integration point is the pair of public lifecycle methods, demonstrated by the framework-agnostic `App.onHostNavigation()` example seam.

## Page Session Metrics

`PageSessionMetrics` carries page-level behavioral metrics alongside the per-field `fields`. These describe behavior across the whole page and never duplicate per-field metrics. All timestamps share the performance timeline (`performance.now()` for lifecycle, `event.timeStamp` for interactions), so spans are directly comparable; negative spans (clock anomalies) resolve to `null`.

The anchor is `startTimeStamp`, captured when `startPageSession()` runs.

| Metric | Definition |
| --- | --- |
| `sessionDurationMs` | `endTimeStamp − startTimeStamp` (both `performance.now()`). |
| `timeToFirstInteractionMs` | First tracked interaction (`focus`/`keydown`/`input`) minus start; recorded once; `null` if none. |
| `timeToFirstInputMs` | First `input` event (first text entered anywhere on the page) minus start; recorded once; `null` if none. Distinct from the per-field `msFromFocusToFirstInput`. |
| `averageTimeBetweenFieldsMs` / `minTimeBetweenFieldsMs` / `maxTimeBetweenFieldsMs` | Summary of field-to-field transitions: time from a field `blur` to the next `focus` on a *different* field. Only running `count`/`sum`/`min`/`max` are stored — no per-transition array. All `null` when there were no transitions. |
| `totalIdleTimeMs` | Sum of gaps between consecutive tracked interactions that exceed `IDLE_THRESHOLD_MS` (2000 ms). Event-stream driven — no timers or polling. Trailing idle (last interaction → session end) is not counted. Defaults to `0`. |

Design notes:

- "Interaction" is restricted to events the behavior service already tracks (`focus`/`keydown`/`input` on tracked inputs). There is no dedicated `click` listener; adding non-field click tracking later only requires feeding `recordInteraction` from a new listener.
- `IDLE_THRESHOLD_MS` is a named constant in `page-session.service.ts` — the policy/extension point for the idle definition.
- The orchestrator feeds primitive timing signals; all computation and state live in `PageSessionService`, keeping measurement DOM-free and the metrics logic in one place.

## Why Responsibilities Are Separated

| Concern | Where it lives | Why separated |
| --- | --- | --- |
| When to listen | `app.ts` + `keystroke-tracking.service.ts` | One startup hook, one listener owner |
| What to track | `keystroke-tracking.constants.ts` + `keystroke-tracking-utils.ts` | Policy vs. pure helpers |
| How to measure (field) | `typing-velocity.service.ts` | Reusable, DOM-free field math |
| Page session lifecycle + aggregation | `page-session.service.ts` | Session batching kept off both the field-math and DOM layers |
| What to emit | `typing-velocity.model.ts` + `page-session.model.ts` | Stable contracts between layers |
| Where to send it | `reportPageSession()` in orchestrator | Single reporting path. POC: `console.log`; production: swap only this |

- Browser event ownership and filtering are orchestration concerns.
- Velocity calculation is a measurement concern.
- Reporting is an integration concern.

This separation minimizes coupling and makes it easier to replace the POC reporting body with production reporting (`reportPageSession(...)`) without changing measurement logic.

Without this structure you would duplicate "is this a tracked input?" logic, tie velocity math to DOM events, and couple reporting to implicit object shapes—each of which makes production integration harder.

## Production Integration Path

To integrate this feature into a real application:

1. Keep listener registration and filtering in `KeystrokeTrackingService`.
2. Reuse `TypingVelocityService` for measurement and `TypingVelocityMetrics` as the payload contract.
3. Follow **Replace and Remove Checklist** below for the POC reporting/UI cutover.

No metric recalculation logic needs to move into the keystroke-tracking service.

## Replace and Remove Checklist

Prefer searching for `POC-only` / `TEMP` if files have drifted.

### Replace (keep the method; change only the body)

| File | Method | Action |
| --- | --- | --- |
| `src/app/services/TS-services/keystroke-tracking.service.ts` | `reportPageSession` | Keep the method. Replace the body so it publishes the completed `PageSessionMetrics` to the enterprise event/reporting API instead of logging to the console (`TEMP`). |

Replace only the method body; keep the signature so measurement and lifecycle code stay untouched.

The public `startPageSession(pageId?)` / `endPageSession(reason?)` methods are the production integration surface for the page-session lifecycle: keep them and call them from the host's navigation system (see `App.onHostNavigation()` for the example seam).

### Keep (not POC scaffolding)

| File | Location | Why it stays |
| --- | --- | --- |
| `src/app/services/TS-services/keystroke-tracking.service.ts` | `pagehide` fallback | The `pagehide` listener and `onPageHide` handler are a permanent safety net that flushes the active session on document teardown. Because `endPageSession()` is idempotent, this never double-reports. Keep it in production. |
| `src/app/app.ts` | `onHostNavigation()` | Example seam; replace its call site with your router's navigation event, but keep the end-then-start pattern. |

The login page has no dependency on keystroke tracking. `KeystrokeTrackingService` is orchestration-only (listeners + lifecycle → measurement/aggregation → `reportPageSession`).
