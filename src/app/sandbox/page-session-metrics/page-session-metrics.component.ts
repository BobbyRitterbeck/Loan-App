import { JsonPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';

import { SandboxPageSessionReporter } from '../sandbox-page-session.reporter';

/**
 * SANDBOX ONLY: shared panel that renders the recorded page-session metrics as
 * JSON. Reused on the login and dashboard pages. Do not transfer this component.
 *
 * It reads from SandboxPageSessionReporter, not from the tracking module, so the
 * module carries no presentation state.
 */
@Component({
  selector: 'app-page-session-metrics',
  imports: [JsonPipe],
  templateUrl: './page-session-metrics.component.html',
  styleUrl: './page-session-metrics.component.scss',
})
export class PageSessionMetricsComponent {
  private readonly reporter = inject(SandboxPageSessionReporter);

  readonly pageSessions = this.reporter.pageSessions;
  readonly pageSessionCount = computed(() => this.pageSessions().length);
}
