import { DecimalPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

// SANDBOX ONLY: the Logout button stands in for router-driven page sessions.
import { KeystrokeTrackingService } from '../../features/keystroke-tracking';
// SANDBOX ONLY: demo panel that displays reported page sessions.
import { PageSessionMetricsComponent } from '../../sandbox/page-session-metrics/page-session-metrics.component';
import { LoanService } from '../../services/loan.service';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-dashboard',
  // SANDBOX ONLY: PageSessionMetricsComponent renders the demo metrics panel.
  imports: [DecimalPipe, RouterLink, PageSessionMetricsComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly loanService = inject(LoanService);
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);
  // SANDBOX ONLY: drives the page-session lifecycle from logout(); see below.
  private readonly keystrokeTrackingService = inject(KeystrokeTrackingService);

  readonly username = computed(() => this.sessionService.currentUsername() ?? '');

  readonly loans = computed(() => {
    const name = this.username();
    this.loanService.loansChanged();
    return name ? this.loanService.getLoansForUser(name) : [];
  });

  readonly hasLoans = computed(() => this.loans().length > 0);

  logout(): void {
    // SANDBOX ONLY: this sandbox is not wired to router navigation events, so the
    // Logout button acts as the host navigation seam. A production host performs
    // this same end-then-start pair from its own navigation system.
    this.keystrokeTrackingService.endPageSession('navigation');
    this.keystrokeTrackingService.startPageSession();

    this.sessionService.logout();
    void this.router.navigate(['/']);
  }
}
