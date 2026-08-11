/**
 * Public surface of the keystroke velocity tracking module.
 *
 * Everything a host application needs is exported here; nothing else in this
 * folder is intended to be imported directly.
 *
 * Host responsibilities:
 *   1. Provide PAGE_SESSION_REPORTER.
 *   2. Call KeystrokeTrackingService.initialize() once at startup.
 *   3. Call endPageSession()/startPageSession() from the navigation system.
 */

// Orchestration and page-session lifecycle.
export { KeystrokeTrackingService } from './keystroke-tracking.service';

// Measurement. Exported for direct unit testing and for hosts that need to
// drive measurement from their own event plumbing.
export { TypingVelocityService } from './typing-velocity.service';
export { PageSessionService } from './page-session.service';

// Reporting boundary: implement this in the host application.
export { PAGE_SESSION_REPORTER, type PageSessionReporter } from './page-session-reporter';

// Output contracts.
export type { TypingVelocityMetrics } from './models/typing-velocity.model';
export type { PageSessionMetrics } from './models/page-session.model';

// Tracked-field detection. Exported so a host that already owns document
// listeners can apply the same rules instead of duplicating them.
export {
  getKeystrokeTrackedFieldId,
  isKeystrokeTrackableInputElement,
} from './keystroke-tracking-utils';
export { KEYSTROKE_TRACKED_INPUT_TYPES } from './keystroke-tracking.constants';
