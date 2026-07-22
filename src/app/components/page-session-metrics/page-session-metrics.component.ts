import { JsonPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';

import { KeystrokeTrackingService } from '../../services/TS-services/keystroke-tracking.service';

/**
 * POC-only: shared panel that renders the recorded page-session metrics as JSON.
 * Reused on the login and dashboard pages. Remove when the PoC is no longer needed.
 */
@Component({
  selector: 'app-page-session-metrics',
  imports: [JsonPipe],
  templateUrl: './page-session-metrics.component.html',
  styleUrl: './page-session-metrics.component.scss',
})
export class PageSessionMetricsComponent {
  private readonly keystrokeTrackingService = inject(KeystrokeTrackingService);

  readonly pageSessions = this.keystrokeTrackingService.pageSessionMetrics;
  readonly pageSessionCount = computed(() => this.pageSessions().length);
}
