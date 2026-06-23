import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-apply-loan',
  imports: [RouterLink],
  templateUrl: './apply-loan.component.html',
  styleUrl: './apply-loan.component.scss',
})
export class ApplyLoanComponent {
  readonly amount = signal('');
  readonly termLength = signal('');
  readonly paymentFrequency = signal('');

  readonly paymentFrequencies = ['weekly', 'biweekly', 'monthly'] as const;

  onAmountInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.amount.set(value);
  }

  onTermLengthInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.termLength.set(value);
  }

  onPaymentFrequencyChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.paymentFrequency.set(value);
  }
}
