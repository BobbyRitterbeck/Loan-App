import { DecimalPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { LoanService } from '../../services/loan.service';
// POC-only: lets the Logout button flush Page Session Metrics to the console/panel. Remove when the PoC ends.
import { KeystrokeTrackingService } from '../../services/TS-services/keystroke-tracking.service';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-dashboard',
  imports: [DecimalPipe, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly loanService = inject(LoanService);
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);
  // POC-only: remove with the end+restart call in logout().
  private readonly keystrokeTrackingService = inject(KeystrokeTrackingService);

  readonly username = computed(() => this.sessionService.currentUsername() ?? '');

  readonly loans = computed(() => {
    const name = this.username();
    this.loanService.loansChanged();
    return name ? this.loanService.getLoansForUser(name) : [];
  });

  readonly hasLoans = computed(() => this.loans().length > 0);

  logout(): void {
    // POC-only: end the current page session (logs Page Session Metrics) and start a fresh one.
    this.keystrokeTrackingService.endPageSession('manual-test');
    this.keystrokeTrackingService.startPageSession();

    this.sessionService.logout();
    void this.router.navigate(['/']);
  }
}
