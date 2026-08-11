# Typing Velocity Tracking Architecture

## Purpose

This feature measures basic typing velocity for tracked input fields and produces summary metrics that can later be reported by a production keystroke-tracking service.

Completed field metrics are collected into a page session and emitted as a single `PageSessionMetrics` report when the page session ends. The architecture intentionally separates event orchestration, measurement, and reporting so production integration can replace only the reporting step.

## Folder Layout

The repository is split so the transferable feature is physically separated from
sandbox scaffolding:

- `src/app/features/keystroke-tracking/` — **the transfer package.** The complete
  feature. Copy this folder into a production application. It depends only on
  `@angular/core` and `@angular/common` (`DOCUMENT`), and it contains no console
  logging, no UI, and no knowledge of any reporting platform.
- `src/app/sandbox/` — **do not transfer.** The sandbox's own reporter and the demo
  metrics panel. This is what makes the sandbox observable; a production app
  replaces it entirely.
- Everything else (`pages/`, `services/`, `models/loan.model.ts`, `app.ts`,
  `app.config.ts`) is the demo loan application. `app.ts` and `app.config.ts` are
  worth reading as host-wiring examples, but they are not part of the feature.

Files marked `SANDBOX ONLY` in comments are scaffolding. Searching for that string
finds every piece the next engineer does not need.

## File Responsibilities

Files are listed in execution order (startup → runtime).

- `src/app/app.ts`
  - Initializes `KeystrokeTrackingService` once at app startup.
  - Provides `onHostNavigation()` — the example host seam showing where an app drives the page-session lifecycle on route transitions (not wired to any router).
- `src/app/features/keystroke-tracking/keystroke-tracking.service.ts`
  - Owns global browser event listeners (`focus`, `keydown`, `input`, `blur`) and orchestration.
  - Filters relevant input elements.
  - Collects each completed field's metrics into the active page session (`PageSessionService.addFieldMetrics`); it does not report per field.
  - Exposes the public page-session lifecycle (`startPageSession(pageId?)`, `endPageSession(reason?)`), enforces no-overlap on start and idempotency on end, and forwards the completed page session to the single reporting seam (`reportPageSession`).
  - Registers a `pagehide` listener as a fallback end trigger for document teardown (safety net; the host normally drives the lifecycle explicitly).
  - Holds no presentation state and performs no logging. `reportPageSession` delegates to the host's `PAGE_SESSION_REPORTER`.
- `src/app/features/keystroke-tracking/page-session.service.ts`
  - Owns the page-session lifecycle (`start`, `end`, `isActive`) and aggregates completed `TypingVelocityMetrics` into a `PageSessionMetrics` batch.
  - Computes page-level behavioral metrics (session duration, time-to-first-interaction/input, field-transition summary, idle time) from primitive timing signals fed by the orchestrator (`recordInteraction`, `recordInput`, `recordFieldFocus`, `recordFieldCompletion`).
  - Stores host-provided `pageId`/`reason` as session metadata (reserved for future reporting; not emitted yet).
  - Performs no per-field measurement and no DOM work.
- `src/app/features/keystroke-tracking/keystroke-tracking-utils.ts`
  - Shared helpers for tracked-input detection and field identification.
- `src/app/features/keystroke-tracking/keystroke-tracking.constants.ts`
  - Shared tracked input-type constants.
- `src/app/features/keystroke-tracking/typing-velocity.service.ts`
  - Performs typing velocity measurement.
  - Keeps field-level measurement state.
  - Produces `TypingVelocityMetrics` when a field session completes (one field via `completeSession`, or all open fields via `completeAllSessions`).
- `src/app/features/keystroke-tracking/models/typing-velocity.model.ts`
  - Defines the output contract consumed by reporting (`TypingVelocityMetrics`).
- `src/app/features/keystroke-tracking/models/page-session.model.ts`
  - Defines the page-session output contract (`PageSessionMetrics`): page-level behavioral metrics plus the field metrics collected during the session.
- `src/app/features/keystroke-tracking/page-session-reporter.ts`
  - Defines the module's only outbound dependency: the `PageSessionReporter` interface and the `PAGE_SESSION_REPORTER` injection token.
  - Has no default implementation on purpose, so a host that forgets to provide one fails at startup instead of silently discarding behavioral signals.
- `src/app/features/keystroke-tracking/index.ts`
  - Declares the module's public surface. Hosts import from here; nothing else in the folder is meant to be imported directly.
- `src/app/sandbox/sandbox-page-session.reporter.ts` — **SANDBOX ONLY**
  - The sandbox's `PageSessionReporter`: logs each page session and keeps a history for the demo panel.
- `src/app/sandbox/page-session-metrics/` — **SANDBOX ONLY**
  - Demo panel that renders reported sessions as JSON. Reads from the sandbox reporter, never from the module.

## Why Each File Exists

### `src/app/app.ts`

Something must turn tracking on once when the app loads. Calling `initialize()` from the root component keeps that a single, explicit bootstrap step. Form components and inputs stay unaware of tracking—no per-field wiring required.

`App` also carries `onHostNavigation()`, an example-only seam showing where a host drives the page-session lifecycle on navigation. It is deliberately not tied to a router: a real app calls it from Angular Router `NavigationEnd`, a React Router effect, or any other navigation signal. The tracking module itself never imports a router, so this seam is the only per-framework change.

### `src/app/features/keystroke-tracking/keystroke-tracking.service.ts`

Browser events are a global, cross-cutting concern. One service owns `document`-level listeners so listeners are not duplicated on every input or component. It sits between "what happened in the DOM" and "what we measure/report," so measurement and reporting can be swapped without touching event wiring.

Capture-phase registration (`addEventListener(..., true)`) mirrors how a production keystroke-tracking service would run: tracking still fires even if a component stops propagation on its own handlers.

### `src/app/features/keystroke-tracking/keystroke-tracking-utils.ts`

"Is this input trackable?" and "What field is this?" are pure logic with no state or side effects. Extracting that from the orchestrator keeps the service focused on listeners and delegation, and makes the rules easy to test and reuse if other keystroke trackers need the same filtering.

### `src/app/features/keystroke-tracking/keystroke-tracking.constants.ts`

The list of tracked input types is a policy decision, not an implementation detail. A dedicated constants file means you change what gets tracked in one place without hunting through listener code. It also provides a single typed source (`as const`) that utils can reference safely.

### `src/app/features/keystroke-tracking/typing-velocity.service.ts`

Velocity math and per-field session state are separate from DOM events. This service can count keystrokes, ignore key repeat, and compute intervals without knowing about `keydown`, `blur`, or `console.log`. That separation matters for production: the keystroke-tracking service keeps listeners; this service remains the reusable measurement engine.

Field measurement state lives here (not in the orchestrator) so multiple fields can be tracked concurrently via `fieldId`, and each session resets cleanly on blur. Raw input accumulators are kept internal to this service and folded into derived behavioral metrics on completion (dominant input type, focus-to-first-input delay, presence of untrusted input, and input-without-keydown) so downstream analysis can distinguish typing, paste, autofill, and scripted input without exposing raw counters or adding scoring logic in the tracking layer.

This service is deliberately **field-scoped**. Page-level session state lives in `page-session.service.ts` so field measurement and page aggregation have separate reasons to change.

### `src/app/features/keystroke-tracking/page-session.service.ts`

A page session is a different granularity than a field session: it spans many fields and has an explicit begin/end lifecycle driven by the host, whereas a field session is implicit (focus → blur). Keeping page-session state and aggregation out of `TypingVelocityService` preserves that service's single responsibility (field math) and out of `KeystrokeTrackingService` keeps session state off the DOM/orchestration layer, consistent with the rest of this architecture.

It collects the `TypingVelocityMetrics` handed to it between `start()` and `end()`, and computes page-level behavioral metrics from primitive timing signals fed by the orchestrator (see "Page Session Metrics"). It keeps only summary accumulators — no arrays of raw transitions or interaction timelines — so state stays small. It also stores the host-provided `pageId`/`reason` as session metadata so the lifecycle API is enterprise-ready, though that metadata is not emitted yet. `PageSessionMetrics` is the extension point where later phases add page-level metrics without changing the reporting seam.

### `src/app/features/keystroke-tracking/models/typing-velocity.model.ts`

Measurement and reporting need a shared contract. The interface defines the shape of completed metrics so `TypingVelocityService` knows what to return and `KeystrokeTrackingService` (and later enterprise reporting) knows what to consume—without coupling those layers through ad-hoc objects that drift apart as the feature grows.

### `src/app/features/keystroke-tracking/page-session-reporter.ts`

Where metrics go is a host decision, not a measurement decision. Inverting it into an injected interface is what keeps the module portable: the sandbox provides a reporter that logs to the console and feeds the demo panel, and a production application provides one that publishes to its enterprise event system. Neither implementation requires any change to the three services above.

This also removes the last piece of presentation state from the module. Earlier revisions kept a signal of reported sessions on `KeystrokeTrackingService` for the demo panel; that state now lives in the sandbox reporter, where it belongs.

The token intentionally has **no default implementation**. A no-op default would make the module drop-in safe, but a host that forgot to provide a reporter would silently lose behavioral signals — the worst possible failure mode for fraud telemetry. Failing at startup is louder and easier to diagnose. The cost is that every host, including test beds, must provide a reporter (see `app.spec.ts`).

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
→ host's `PAGE_SESSION_REPORTER` (sandbox: console + demo panel; production: enterprise events)

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

> **Sandbox deviation.** `initialize()` opens the first page session itself, because
> this sandbox is not wired to router navigation events. In a production host that
> call should be removed and every session boundary driven from navigation. The
> sandbox's Login and Logout buttons stand in for that navigation seam — they perform
> the same end-then-start pair a router subscription would.

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
- A page session with **no** field metrics is **not** reported. `endPageSession()` gates on `pageMetrics.fields.length > 0`, so a page the user opened but never typed in produces no report at all — including its page-level metrics (`sessionDurationMs`, `totalIdleTimeMs`, `timeToFirstInteractionMs`). Whether that is desirable is a consumer policy decision, not a measurement one; see "Known Issues and Open Items".

Framework independence:

- The module never imports Angular Router, React Router, or any routing library. The only integration point is the pair of public lifecycle methods, demonstrated by the framework-agnostic `App.onHostNavigation()` example seam.

## Page Session Metrics

`PageSessionMetrics` carries page-level behavioral metrics alongside the per-field `fields`. These describe behavior across the whole page and never duplicate per-field metrics.

Timestamps come from two sources that are *normally* on the same performance timeline: `performance.now()` for lifecycle boundaries and `event.timeStamp` for interactions. Spans are therefore usually directly comparable, and negative spans (clock anomalies) resolve to `null`. This assumption does **not** hold for script-dispatched events originating in another realm, which can yield large bogus positive spans that the guard does not catch — see "Known Issues and Open Items".

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
| Where to send it | `PAGE_SESSION_REPORTER` token | Single reporting path, injected by the host. Sandbox: console + demo panel; production: enterprise events |

- Browser event ownership and filtering are orchestration concerns.
- Velocity calculation is a measurement concern.
- Reporting is an integration concern.

This separation means production reporting is added by providing a different `PAGE_SESSION_REPORTER`, without changing measurement logic.

Without this structure you would duplicate "is this a tracked input?" logic, tie velocity math to DOM events, and couple reporting to implicit object shapes—each of which makes production integration harder.

## Transfer Checklist

### What to take

Copy `src/app/features/keystroke-tracking/` in full. Nothing in it needs editing to
compile, and no file in it imports anything outside itself, `@angular/core`, or
`@angular/common`.

### What to leave behind

Everything under `src/app/sandbox/`, plus the demo application (`pages/`, `services/`,
`models/loan.model.ts`). Search for `SANDBOX ONLY` to find every scaffolding touch point.

### What the host application must do

1. **Provide a reporter.** Implement `PageSessionReporter` and bind it to
   `PAGE_SESSION_REPORTER`. See `src/app/app.config.ts` for the sandbox's wiring and
   `src/app/sandbox/sandbox-page-session.reporter.ts` for a reference implementation.
   This is the only place enterprise event knowledge belongs.
2. **Call `initialize()` once at startup,** and delete the `SANDBOX ONLY`
   `startPageSession()` call inside it.
3. **Drive the lifecycle from navigation.** End the current session, then start the
   next, on every route transition. `App.onHostNavigation()` shows the pattern; the
   module never imports a router.

### If the host already owns document listeners

An application that already has a behavior-tracking service with `document` listeners
and its own tracked-field checks should reuse this module's
`isKeystrokeTrackableInputElement` and `getKeystrokeTrackedFieldId` rather than keeping
a second copy of those rules. Both are exported from the module's `index.ts`. Two
independent definitions of "which fields do we track" will drift, and events about the
same field will stop agreeing with each other.

Note that `KEYSTROKE_TRACKED_INPUT_TYPES` is a module-level constant. A host that
inlines an equivalent array inside a predicate will allocate it on every keystroke
rather than every paste, which is why it lives outside the function here.

### What stays in production

- The `pagehide` listener and `onPageHide` handler: a permanent safety net that flushes
  the active session on document teardown. Because `endPageSession()` is idempotent,
  this never double-reports.
- `startPageSession(pageId?)` / `endPageSession(reason?)`: the lifecycle surface.
- All three services and both models, unchanged.

## Known Issues and Open Items

These are documented rather than fixed, deliberately: each one needs a decision that
depends on production or enterprise event requirements.

### Confirmed issues

1. **Implausible focus-relative timings from cross-realm events.**
   `TypingVelocityService.nonNegativeSpan` rejects negative spans but has no upper
   bound. `docs/test-results.md` records `msFromFocusToFirstInput` values of
   `49124.2` and `90578.8` ms for instantaneous scripted fills — consistent with a
   synthetic event carrying a `timeStamp` from a different realm's time origin. For a
   fraud model this inverts the signal: a bot reads as a very deliberate human. Needs a
   plausibility bound, a recorded time source, or an explicit "timing untrusted" flag.
   The right choice depends on what the consuming model wants.

2. **`totalKeystrokes` counts non-character keys.** `onKeydown` filters nothing, so
   Tab, Shift, Ctrl, arrows, and Backspace all count. Because Tab's `keydown` fires on
   the field before `blur`, tab-navigating users get one phantom keystroke per field and
   a polluted final interval. `totalKeystrokes` is therefore *not* "characters entered."
   Filtering is possible without weakening data minimization — read `event.key` at the
   listener boundary and discard it, exactly as `repeat` is handled today.

3. **Password length is derivable.** `totalKeystrokes` and `inputType: 'password'` are
   both emitted, and `password` is in `KEYSTROKE_TRACKED_INPUT_TYPES`. Needs a privacy
   decision: keep, bucket, or exclude. No key values or field values are captured
   anywhere — notably `InputEvent.data` is never read — so this is residual inference,
   not content capture.

4. **Field identity is `element.name || element.id`, unscoped.** Two inputs sharing a
   `name` in different forms on one page merge into one measurement bucket, and an input
   with neither attribute is silently untracked — the loan amount input in
   `apply-loan.component.html` is exactly this case. This matches the convention already
   used in production behavior tracking, so it is intentionally left alone; the
   constraint just needs to be a documented form-authoring rule.

5. **Zero-field page sessions are dropped** (see "Metadata and reporting"). Whether
   "page opened, nothing typed" is a signal worth emitting is a consumer decision.

6. **`pageId` and `endReason` are write-only.** `PageSessionService` stores both and
   nothing reads them. They are the natural place to carry host context — for example a
   snapshot of correlation identifiers taken at session start, which matters because a
   page session ends *during* navigation, when live application state may already be
   resetting. Left unwired because the required identifiers are not yet known.

### Not defects

- Per-event work is trivial: a `tagName` check, one array `includes`, and two property
  reads. No DOM queries, no layout reads, no timers, no polling.
- Field state is bounded. `completeSession` deletes its entry on `blur` and
  `completeAllSessions` clears the map, so `fields` never exceeds the number of tracked
  inputs on the page.
- `console.warn` in `startPageSession` is the module's only console call. It fires only
  on invalid lifecycle usage (starting a session while one is active). Consider gating it
  behind `isDevMode()` in production.
- Listeners are never removed. `initialize()` is idempotent and the service is a root
  singleton, so for a normal SPA the listeners live exactly as long as the document. A
  host that mounts and unmounts the application repeatedly should add teardown.

### Test coverage gap

There are no unit tests for `TypingVelocityService` or `PageSessionService`, which
between them hold all of the arithmetic. The Cypress specs under `cypress/` are the only
automated verification, and they assert against the sandbox demo panel's rendered JSON
(`cypress/support/commands.ts` reads `.metrics-list details pre`). They therefore do not
transfer. Direct unit tests are the highest-value addition for the receiving team: both
services take primitives and return plain objects, so they need no mocks, no DOM, and no
`TestBed`.
