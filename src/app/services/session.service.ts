import { Injectable, inject, signal } from '@angular/core';

import { StorageService } from './storage.service';

const CURRENT_USER_KEY = 'loan-portal-current-user';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly storage = inject(StorageService);

  /** Reactive read of the logged-in username for components that need to react to changes. */
  readonly currentUsername = signal<string | null>(this.readStoredUsername());

  getCurrentUsername(): string | null {
    return this.currentUsername();
  }

  isLoggedIn(): boolean {
    return this.currentUsername() !== null;
  }

  login(username: string): void {
    const normalized = username.trim().toLowerCase();
    this.storage.setItem(CURRENT_USER_KEY, normalized);
    this.currentUsername.set(normalized);
  }

  logout(): void {
    this.storage.removeItem(CURRENT_USER_KEY);
    this.currentUsername.set(null);
  }

  private readStoredUsername(): string | null {
    return this.storage.getItem<string>(CURRENT_USER_KEY);
  }
}
