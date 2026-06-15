import { Injectable, inject } from '@angular/core';

import { Loan } from '../models/loan.model';
import { StorageService } from './storage.service';

const LOANS_KEY = 'loan-portal-loans';

type LoansByUser = Record<string, Loan[]>;

@Injectable({ providedIn: 'root' })
export class LoanService {
  private readonly storage = inject(StorageService);

  getLoansForUser(username: string): Loan[] {
    const loansByUser = this.storage.getItem<LoansByUser>(LOANS_KEY) ?? {};
    return loansByUser[username] ?? [];
  }
}
