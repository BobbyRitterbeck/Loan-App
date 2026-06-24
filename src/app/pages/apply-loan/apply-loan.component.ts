import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { LoanApplication } from '../../models/loan.model';
import { LoanService } from '../../services/loan.service';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-apply-loan',
  imports: [RouterLink],
  templateUrl: './apply-loan.component.html',
  styleUrl: './apply-loan.component.scss',
})
export class ApplyLoanComponent {
  private readonly loanService = inject(LoanService);
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);

  readonly amount = signal('');
  readonly termLength = signal('');
  readonly paymentFrequency = signal('');
  readonly amountBlurred = signal(false);

  readonly paymentFrequencies = ['biweekly', 'monthly'] as const;
  readonly termLengths = [36, 60] as const;

  readonly showAmountError = computed(
    () => this.amountBlurred() && !this.loanService.isValidLoanAmount(Number(this.amount())),
  );

  readonly canSubmit = computed(() => {
    const amount = Number(this.amount());
    const termLength = this.termLength();
    const frequency = this.paymentFrequency();

    return (
      this.loanService.isValidLoanAmount(amount) &&
      this.termLengths.some((length) => String(length) === termLength) &&
      (this.paymentFrequencies as readonly string[]).includes(frequency)
    );
  });

  onAmountInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.amount.set(value);
  }

  onAmountBlur(): void {
    this.amountBlurred.set(true);
  }

  onTermLengthChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.termLength.set(value);
  }

  onPaymentFrequencyChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.paymentFrequency.set(value);
  }

  submit(): void {
    if (!this.canSubmit()) {
      return;
    }

    const username = this.sessionService.getCurrentUsername();
    if (!username) {
      void this.router.navigate(['/']);
      return;
    }

    const application: LoanApplication = {
      amount: Number(this.amount()),
      termLength: Number(this.termLength()),
      paymentFrequency: this.paymentFrequency(),
    };

    const loan = this.loanService.applyForLoan(username, application);
    if (!loan) {
      return;
    }

    void this.router.navigate(['/dashboard']);
  }
}
