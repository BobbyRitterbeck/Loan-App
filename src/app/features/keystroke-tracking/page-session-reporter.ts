import { InjectionToken } from '@angular/core';

import { PageSessionMetrics } from './models/page-session.model';

/**
 * Destination for completed page sessions, supplied by the host application.
 *
 * This is the module's only outbound dependency and the single place production
 * integration happens. The keystroke module never knows where metrics go: the
 * sandbox provides a console/UI implementation, and a production app provides
 * one that publishes to its enterprise event system.
 */
export interface PageSessionReporter {
  report(metrics: PageSessionMetrics): void;
}

/**
 * Deliberately has no default implementation. A host that forgets to provide a
 * reporter fails at startup rather than silently discarding behavioral signals.
 */
export const PAGE_SESSION_REPORTER = new InjectionToken<PageSessionReporter>(
  'PAGE_SESSION_REPORTER',
);
