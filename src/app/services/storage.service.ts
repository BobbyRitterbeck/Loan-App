import { Injectable } from '@angular/core';

/**
 * Thin wrapper around localStorage.
 * Centralizes persistence so services stay easy to test and swap for API calls later.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  getItem<T>(key: string): T | null {
    const raw = localStorage.getItem(key);
    if (raw === null) {
      return null;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  setItem<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }
}
