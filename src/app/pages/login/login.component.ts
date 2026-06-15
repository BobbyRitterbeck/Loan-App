import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { SessionService } from '../../services/session.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly userService = inject(UserService);
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);

  readonly username = signal('');

  readonly trimmedUsername = computed(() => this.username().trim());

  readonly userExists = computed(() => {
    const name = this.trimmedUsername();
    return name.length > 0 && this.userService.userExists(name);
  });

  readonly canCreateAccount = computed(() => {
    const name = this.trimmedUsername();
    return name.length > 0 && !this.userService.userExists(name);
  });

  onUsernameInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.username.set(value);
  }

  login(): void {
    const name = this.trimmedUsername();
    if (!name || !this.userService.userExists(name)) {
      return;
    }

    this.sessionService.login(name);
    void this.router.navigate(['/dashboard']);
  }

  createAccount(): void {
    const name = this.trimmedUsername();
    if (!name || this.userService.userExists(name)) {
      return;
    }

    this.userService.createUser(name);
    this.sessionService.login(name);
    void this.router.navigate(['/dashboard']);
  }
}
