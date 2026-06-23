export interface LoanApplication {
  amount: number;
  termLength: number;
  paymentFrequency: string;
}

export interface Loan {
  id: string;
  amount: number;
  termLength: number;
  paymentFrequency: string;
  status: string;
  appliedDate: string;
}
