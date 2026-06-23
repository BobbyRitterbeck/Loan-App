import { Routes } from '@angular/router';

import { ApplyLoanComponent } from './pages/apply-loan/apply-loan.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LoginComponent } from './pages/login/login.component';

export const routes: Routes = [
  {
    path: '',
    component: LoginComponent,
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
  },
  {
    path: 'apply-loan',
    component: ApplyLoanComponent,
  },
  {
    path: '**',
    redirectTo: '',
  },
];
