import { Injectable, inject } from '@angular/core';

import { StorageService } from './storage.service';

const USERS_KEY = 'loan-portal-users';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly storage = inject(StorageService);

  getAllUsernames(): string[] {
    return this.storage.getItem<string[]>(USERS_KEY) ?? [];
  }

  userExists(username: string): boolean {
    const normalized = this.normalizeUsername(username);
    return this.getAllUsernames().includes(normalized);
  }

  createUser(username: string): void {
    const normalized = this.normalizeUsername(username);
    if (!normalized || this.userExists(normalized)) {
      return;
    }

    const users = this.getAllUsernames();
    users.push(normalized);
    this.storage.setItem(USERS_KEY, users);
  }

  private normalizeUsername(username: string): string {
    return username.trim().toLowerCase();
  }
}
