import { Injectable, inject, signal } from '@angular/core';

import { Loan, LoanApplication } from '../models/loan.model';
import { StorageService } from './storage.service';

const LOANS_KEY = 'loan-portal-loans';

const PAYMENT_FREQUENCIES = ['biweekly', 'monthly'] as const;

type LoansByUser = Record<string, Loan[]>;

@Injectable({ providedIn: 'root' })
export class LoanService {
  private readonly storage = inject(StorageService);

  /** Bumped after writes so readers can react to storage changes. */
  readonly loansChanged = signal(0);

  getLoansForUser(username: string): Loan[] {
    const loansByUser = this.storage.getItem<LoansByUser>(LOANS_KEY) ?? {};
    return loansByUser[username] ?? [];
  }

  applyForLoan(username: string, application: LoanApplication): Loan | null {
    const normalizedUsername = username.trim().toLowerCase();
    if (!normalizedUsername || !this.isValidApplication(application)) {
      return null;
    }

    const loan: Loan = {
      id: crypto.randomUUID(),
      amount: application.amount,
      termLength: application.termLength,
      paymentFrequency: application.paymentFrequency,
      status: 'Pending',
      appliedDate: new Date().toISOString().slice(0, 10),
    };

    const loansByUser = this.storage.getItem<LoansByUser>(LOANS_KEY) ?? {};
    const userLoans = loansByUser[normalizedUsername] ?? [];
    loansByUser[normalizedUsername] = [...userLoans, loan];
    this.storage.setItem(LOANS_KEY, loansByUser);
    this.loansChanged.update((count) => count + 1);

    return loan;
  }

  private isValidApplication(application: LoanApplication): boolean {
    const { amount, termLength, paymentFrequency } = application;

    return (
      amount > 0 &&
      termLength > 0 &&
      PAYMENT_FREQUENCIES.includes(
        paymentFrequency as (typeof PAYMENT_FREQUENCIES)[number],
      )
    );
  }
}
