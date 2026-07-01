# Typing Velocity Tracking Architecture

## Purpose

This feature measures basic typing velocity for tracked input fields and produces summary metrics that can later be reported by a production Behavior Service.

The current sandbox reports metrics to the console, but the architecture intentionally separates event orchestration, measurement, and reporting so production integration can replace only the reporting step.

## File Responsibilities

- `src/app/services/behavior-tracking.service.ts`
  - Owns global browser event listeners (`keydown`, `blur`) and application-level orchestration.
  - Filters relevant input elements.
  - Forwards typed event data into `TypingVelocityService`.
  - Receives completed metrics and passes them to a reporting seam.
- `src/app/services/typing-velocity.service.ts`
  - Performs typing velocity measurement.
  - Keeps field-level measurement state.
  - Produces `TypingVelocityMetrics` when a field session completes.
- `src/app/models/typing-velocity.model.ts`
  - Defines the output contract consumed by reporting (`TypingVelocityMetrics`).
- `src/app/services/behavior-tracking.constants.ts`
  - Shared tracked input-type constants.
- `src/app/services/behavior-tracking.utils.ts`
  - Shared helpers for tracked-input detection and field identification.
- `src/app/app.ts`
  - Initializes `BehaviorTrackingService` once at app startup.

## Event Flow

Browser Events
→ `BehaviorTrackingService` global listeners
→ tracked-input filtering
→ `TypingVelocityService` measurement updates
→ `TypingVelocityMetrics`
→ reporting seam (`reportTypingVelocity`, currently `console.log`)

## Session Lifecycle

- Session begins implicitly on first tracked `keydown` for a field.
- Additional `keydown` events update interval summaries.
- Session ends on tracked input `blur`.
- On session end, `TypingVelocityService.completeSession(fieldId)` returns summary metrics.

## Why Responsibilities Are Separated

- Browser event ownership and filtering are orchestration concerns.
- Velocity calculation is a measurement concern.
- Reporting is an integration concern.

This separation minimizes coupling and makes it easier to replace console reporting with production reporting (for example, `reportTypingVelocity(...)`) without changing measurement logic.

## Production Integration Path

To integrate into production Behavior Service:

1. Keep listener registration and filtering in Behavior Service.
2. Reuse `TypingVelocityService` for measurement.
3. Replace `reportTypingVelocity` console reporting with enterprise event reporting.

No metric recalculation logic needs to move into Behavior Service.
