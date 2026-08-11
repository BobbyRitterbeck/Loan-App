import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

// SANDBOX ONLY: the Login button stands in for router-driven page sessions.
import { KeystrokeTrackingService } from '../../features/keystroke-tracking';
// SANDBOX ONLY: demo panel that displays reported page sessions.
import { PageSessionMetricsComponent } from '../../sandbox/page-session-metrics/page-session-metrics.component';
import { SessionService } from '../../services/session.service';
import { UserService } from '../../services/user.service';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

@Component({
  selector: 'app-login',
  // SANDBOX ONLY: PageSessionMetricsComponent renders the demo metrics panel.
  imports: [PageSessionMetricsComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly userService = inject(UserService);
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);
  // SANDBOX ONLY: drives the page-session lifecycle from login(); see below.
  private readonly keystrokeTrackingService = inject(KeystrokeTrackingService);

  readonly username = signal('');
  readonly email = signal('');
  readonly password = signal('');

  readonly trimmedUsername = computed(() => this.username().trim());
  readonly trimmedEmail = computed(() => this.email().trim());

  readonly emailValid = computed(() => EMAIL_PATTERN.test(this.trimmedEmail()));
  readonly passwordValid = computed(() => this.password().length >= MIN_PASSWORD_LENGTH);

  readonly userExists = computed(() => {
    const name = this.trimmedUsername();
    return name.length > 0 && this.userService.userExists(name);
  });

  readonly isNewUsername = computed(() => {
    const name = this.trimmedUsername();
    return name.length > 0 && !this.userService.userExists(name);
  });

  readonly canLogin = computed(() => this.userExists() && this.passwordValid());

  readonly canCreateAccount = computed(
    () => this.isNewUsername() && this.emailValid() && this.passwordValid(),
  );

  onUsernameInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.username.set(value);
  }

  onEmailInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.email.set(value);
  }

  onPasswordInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.password.set(value);
  }

  login(): void {
    if (!this.canLogin()) {
      return;
    }

    // SANDBOX ONLY: this sandbox is not wired to router navigation events, so the
    // Login button acts as the host navigation seam. A production host performs
    // this same end-then-start pair from its own navigation system.
    this.keystrokeTrackingService.endPageSession('navigation');
    this.keystrokeTrackingService.startPageSession();

    this.sessionService.login(this.trimmedUsername());
    void this.router.navigate(['/dashboard']);
  }

  createAccount(): void {
    if (!this.canCreateAccount()) {
      return;
    }

    const name = this.trimmedUsername();
    this.userService.createUser(name);
    this.sessionService.login(name);
    void this.router.navigate(['/dashboard']);
  }
}
