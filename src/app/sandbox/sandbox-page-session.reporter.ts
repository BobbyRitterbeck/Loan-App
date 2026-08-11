import { Injectable, signal } from '@angular/core';

import { PageSessionMetrics } from '../features/keystroke-tracking/models/page-session.model';
import { PageSessionReporter } from '../features/keystroke-tracking/page-session-reporter';

/**
 * SANDBOX ONLY: the sandbox's implementation of the module's reporting boundary.
 *
 * Logs each completed page session and keeps an in-memory history for the demo
 * panel. Do not transfer this file. A production app provides its own
 * PageSessionReporter that publishes to its enterprise event system instead.
 */
@Injectable({ providedIn: 'root' })
export class SandboxPageSessionReporter implements PageSessionReporter {
  /** Reported sessions, newest first. Unbounded on purpose: demo only. */
  readonly pageSessions = signal<PageSessionMetrics[]>([]);

  report(metrics: PageSessionMetrics): void {
    console.log('Page session metrics', metrics);
    this.pageSessions.update((sessions) => [metrics, ...sessions]);
  }
}
