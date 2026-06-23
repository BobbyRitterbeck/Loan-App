import { DecimalPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { LoanService } from '../../services/loan.service';
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

  readonly username = computed(() => this.sessionService.currentUsername() ?? '');

  readonly loans = computed(() => {
    const name = this.username();
    return name ? this.loanService.getLoansForUser(name) : [];
  });

  readonly hasLoans = computed(() => this.loans().length > 0);

  logout(): void {
    this.sessionService.logout();
    void this.router.navigate(['/']);
  }
}
