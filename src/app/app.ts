import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { KeystrokeTrackingService } from './services/TS-services/keystroke-tracking.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly keystrokeTrackingService = inject(KeystrokeTrackingService);

  constructor() {
    this.keystrokeTrackingService.initialize();
  }

  /**
   * EXAMPLE ONLY — host integration seam for the page-session lifecycle.
   *
   * This is where a real application drives page sessions. Call it from your
   * navigation system on every route transition:
   *   - Angular Router: subscribe to `NavigationEnd`
   *   - React Router:   a `useEffect` on the location/pathname
   *   - anything else:  wherever "the page changed" is known
   *
   * The pattern is always the same and framework-agnostic: end the current
   * session, then start the next one. The tracking module never imports a
   * router, so this seam is the only thing that changes per framework.
   *
   * Not wired to navigation in this sandbox on purpose — replace the call site
   * with your router's navigation event in a real app.
   */
  onHostNavigation(nextPageId?: string): void {
    this.keystrokeTrackingService.endPageSession('navigation');
    this.keystrokeTrackingService.startPageSession(nextPageId);
  }
}
